'use client'

import React, { useState, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useParams, useRouter } from 'next/navigation'
import { TRANSFORMATIONS } from '../../../lib/constants'
import { editImage, generateVideo } from '../../../services/openaiService'
import type { GeneratedContent, Transformation } from '../../../types'
import LoadingSpinner from '../../../components/LoadingSpinner'
import ErrorMessage from '../../../components/ErrorMessage'
import {
  dataUrlToFile,
  embedWatermark,
  loadImage,
  resizeImageToMatch,
  downloadImage,
} from '../../../utils/fileUtils'
import { useTranslation } from '../../../i18n/context'
import { useHistory } from '../../../contexts/HistoryContext'
import { ChevronLeft } from 'lucide-react'

const ImageEditorCanvas = dynamic(() => import('../../../components/ImageEditorCanvas'), {
  ssr: false,
})
const ResultDisplay = dynamic(() => import('../../../components/ResultDisplay'), { ssr: false })
const ImagePreviewModal = dynamic(() => import('../../../components/ImagePreviewModal'), {
  ssr: false,
})
const MultiImageUploader = dynamic(() => import('../../../components/MultiImageUploader'), {
  ssr: false,
})

type ActiveTool = 'mask' | 'none'

export default function GenerationPage() {
  const router = useRouter()
  const params = useParams()
  const { t } = useTranslation()
  const { addHistoryItem, selectedImageToEdit, setSelectedImageToEdit } = useHistory()

  const styleKey = params.style as string
  const selectedTransformation = TRANSFORMATIONS.find((t) => t.key === styleKey)

  const [primaryImageUrl, setPrimaryImageUrl] = useState<string | null>(null)
  const [primaryFile, setPrimaryFile] = useState<File | null>(null)
  const [secondaryImageUrl, setSecondaryImageUrl] = useState<string | null>(null)
  const [secondaryFile, setSecondaryFile] = useState<File | null>(null)
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [loadingMessage, setLoadingMessage] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [maskDataUrl, setMaskDataUrl] = useState<string | null>(null)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [customPrompt, setCustomPrompt] = useState<string>('')
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9')
  const [activeTool, setActiveTool] = useState<ActiveTool>('none')

  // Redirect if invalid style
  useEffect(() => {
    if (!selectedTransformation) {
      router.replace('/dashboard')
    }
  }, [selectedTransformation, router])

  // Initialize prompt
  useEffect(() => {
    if (selectedTransformation && selectedTransformation.prompt !== 'CUSTOM') {
      setCustomPrompt('')
    }
  }, [selectedTransformation])

  const handleUseImageAsInput = useCallback(
    async (imageUrl: string) => {
      if (!imageUrl) return

      try {
        const newFile = await dataUrlToFile(imageUrl, `edited-${Date.now()}.png`)
        setPrimaryFile(newFile)
        setPrimaryImageUrl(imageUrl)
        setGeneratedContent(null)
        setError(null)
        setMaskDataUrl(null)
        setActiveTool('none')
        setSecondaryFile(null)
        setSecondaryImageUrl(null)
      } catch (err) {
        console.error('Failed to use image as input:', err)
        setError(t('app.error.useAsInputFailed'))
      }
    },
    [t]
  )

  // Handle selectedImageToEdit from history
  useEffect(() => {
    if (selectedImageToEdit) {
      handleUseImageAsInput(selectedImageToEdit)
      setSelectedImageToEdit(null)
    }
  }, [selectedImageToEdit, handleUseImageAsInput, setSelectedImageToEdit])

  const handlePrimaryImageSelect = useCallback((file: File, dataUrl: string) => {
    setPrimaryFile(file)
    setPrimaryImageUrl(dataUrl)
    setGeneratedContent(null)
    setError(null)
    setMaskDataUrl(null)
    setActiveTool('none')
  }, [])

  const handleSecondaryImageSelect = useCallback((file: File, dataUrl: string) => {
    setSecondaryFile(file)
    setSecondaryImageUrl(dataUrl)
    setGeneratedContent(null)
    setError(null)
  }, [])

  const handleClearPrimaryImage = () => {
    setPrimaryImageUrl(null)
    setPrimaryFile(null)
    setGeneratedContent(null)
    setError(null)
    setMaskDataUrl(null)
    setActiveTool('none')
  }

  const handleClearSecondaryImage = () => {
    setSecondaryImageUrl(null)
    setSecondaryFile(null)
  }

  const handleGenerateVideo = useCallback(async () => {
    if (!selectedTransformation) return

    const promptToUse = customPrompt
    if (!promptToUse.trim()) {
      setError(t('app.error.enterPrompt'))
      return
    }

    setIsLoading(true)
    setError(null)
    setGeneratedContent(null)

    try {
      let imagePayload = null
      if (primaryImageUrl) {
        const primaryMimeType = primaryImageUrl.split(';')[0].split(':')[1] ?? 'image/png'
        const primaryBase64 = primaryImageUrl.split(',')[1]
        imagePayload = { base64: primaryBase64, mimeType: primaryMimeType }
      }

      const videoDownloadUrl = await generateVideo(
        promptToUse,
        imagePayload,
        aspectRatio,
        (message) => setLoadingMessage(message)
      )

      setLoadingMessage(t('app.loading.videoFetching'))
      const response = await fetch(videoDownloadUrl)
      if (!response.ok) {
        throw new Error(`Failed to download video file. Status: ${response.statusText}`)
      }
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)

      const result: GeneratedContent = {
        imageUrl: null,
        text: null,
        videoUrl: objectUrl,
      }

      setGeneratedContent(result)
      addHistoryItem(result)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : t('app.error.unknown'))
    } finally {
      setIsLoading(false)
      setLoadingMessage('')
    }
  }, [selectedTransformation, customPrompt, primaryImageUrl, aspectRatio, t, addHistoryItem])

  const handleGenerateImage = useCallback(async () => {
    if (!primaryImageUrl || !selectedTransformation) {
      setError(t('app.error.uploadAndSelect'))
      return
    }
    if (
      selectedTransformation.isMultiImage &&
      !selectedTransformation.isSecondaryOptional &&
      !secondaryImageUrl
    ) {
      setError(t('app.error.uploadBoth'))
      return
    }

    const promptToUse =
      selectedTransformation.prompt === 'CUSTOM' ? customPrompt : selectedTransformation.prompt
    if (!promptToUse.trim()) {
      setError(t('app.error.enterPrompt'))
      return
    }

    setIsLoading(true)
    setError(null)
    setGeneratedContent(null)
    setLoadingMessage('')

    try {
      const primaryMimeType = primaryImageUrl!.split(';')[0].split(':')[1] ?? 'image/png'
      const primaryBase64 = primaryImageUrl!.split(',')[1]
      const maskBase64 = maskDataUrl ? maskDataUrl.split(',')[1] : null

      if (selectedTransformation.isTwoStep) {
        setLoadingMessage(t('app.loading.step1'))
        const stepOneResult = await editImage(
          primaryBase64,
          primaryMimeType,
          promptToUse,
          null,
          null
        )

        if (!stepOneResult.imageUrl)
          throw new Error('Step 1 (line art) failed to generate an image.')

        setLoadingMessage(t('app.loading.step2'))
        const stepOneImageBase64 = stepOneResult.imageUrl.split(',')[1]
        const stepOneImageMimeType =
          stepOneResult.imageUrl.split(';')[0].split(':')[1] ?? 'image/png'

        let secondaryImagePayload = null
        if (secondaryImageUrl) {
          const primaryImage = await loadImage(primaryImageUrl)
          const resizedSecondaryImageUrl = await resizeImageToMatch(secondaryImageUrl, primaryImage)
          const secondaryMimeType =
            resizedSecondaryImageUrl.split(';')[0].split(':')[1] ?? 'image/png'
          const secondaryBase64 = resizedSecondaryImageUrl.split(',')[1]
          secondaryImagePayload = { base64: secondaryBase64, mimeType: secondaryMimeType }
        }

        const stepTwoResult = await editImage(
          stepOneImageBase64,
          stepOneImageMimeType,
          selectedTransformation.stepTwoPrompt!,
          null,
          secondaryImagePayload
        )

        if (stepTwoResult.imageUrl) {
          stepTwoResult.imageUrl = await embedWatermark(stepTwoResult.imageUrl, 'Banana Shop')
        }

        const finalResult = { ...stepTwoResult, secondaryImageUrl: stepOneResult.imageUrl }
        setGeneratedContent(finalResult)
        addHistoryItem(finalResult)
      } else {
        let secondaryImagePayload = null
        if (selectedTransformation.isMultiImage && secondaryImageUrl) {
          const secondaryMimeType = secondaryImageUrl.split(';')[0].split(':')[1] ?? 'image/png'
          const secondaryBase64 = secondaryImageUrl.split(',')[1]
          secondaryImagePayload = { base64: secondaryBase64, mimeType: secondaryMimeType }
        }
        setLoadingMessage(t('app.loading.default'))
        const result = await editImage(
          primaryBase64,
          primaryMimeType,
          promptToUse,
          maskBase64,
          secondaryImagePayload
        )

        if (result.imageUrl) result.imageUrl = await embedWatermark(result.imageUrl, 'Banana Shop')

        setGeneratedContent(result)
        addHistoryItem(result)
      }
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : t('app.error.unknown'))
    } finally {
      setIsLoading(false)
      setLoadingMessage('')
    }
  }, [
    primaryImageUrl,
    secondaryImageUrl,
    selectedTransformation,
    maskDataUrl,
    customPrompt,
    t,
    addHistoryItem,
  ])

  const handleGenerate = useCallback(() => {
    if (selectedTransformation?.isVideo) {
      handleGenerateVideo()
    } else {
      handleGenerateImage()
    }
  }, [selectedTransformation, handleGenerateVideo, handleGenerateImage])

  const handleDownload = (url: string, type: string) => {
    const fileExtension = type.includes('video') ? 'mp4' : url.split(';')[0].split('/')[1] || 'png'
    const filename = `${type}-${Date.now()}.${fileExtension}`
    downloadImage(url, filename)
  }

  const handleOpenPreview = (url: string) => setPreviewImageUrl(url)
  const handleClosePreview = () => setPreviewImageUrl(null)
  const toggleMaskTool = () => setActiveTool((current) => (current === 'mask' ? 'none' : 'mask'))

  if (!selectedTransformation) return null

  const isCustomPromptEmpty = selectedTransformation.prompt === 'CUSTOM' && !customPrompt.trim()

  let isGenerateDisabled = true
  if (selectedTransformation.isVideo) {
    isGenerateDisabled = isLoading || !customPrompt.trim()
  } else {
    let imagesReady = false
    if (selectedTransformation.isMultiImage) {
      if (selectedTransformation.isSecondaryOptional) {
        imagesReady = !!primaryImageUrl
      } else {
        imagesReady = !!primaryImageUrl && !!secondaryImageUrl
      }
    } else {
      imagesReady = !!primaryImageUrl
    }
    isGenerateDisabled = isLoading || isCustomPromptEmpty || !imagesReady
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl pb-24">
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => router.push('/dashboard')}
          className="p-2 rounded-full hover:bg-[var(--bg-secondary)] transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-[var(--text-primary)]" />
        </button>
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]">
          {t(selectedTransformation.titleKey)}
        </h2>
      </div>

      {selectedTransformation.descriptionKey && (
        <div className="mb-8">
          <p className="text-[var(--text-secondary)] text-lg">
            {t(selectedTransformation.descriptionKey)}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Input Column */}
        <div className="space-y-6">
          <div className="bg-[var(--bg-card)] rounded-xl shadow-lg border border-[var(--border-primary)] p-6">
            <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">
              {t('app.input')}
            </h3>

            {selectedTransformation.isVideo ? (
              <>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder={t('transformations.video.promptPlaceholder')}
                  rows={4}
                  className="w-full mt-2 p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] transition-colors placeholder-[var(--text-tertiary)]"
                />
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                    {t('transformations.video.aspectRatio')}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {(['16:9', '9:16'] as const).map((ratio) => (
                      <button
                        key={ratio}
                        onClick={() => setAspectRatio(ratio)}
                        className={`py-2 px-3 text-sm font-semibold rounded-md transition-colors duration-200 ${
                          aspectRatio === ratio
                            ? 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-[var(--text-on-accent)]'
                            : 'bg-[rgba(107,114,128,0.2)] hover:bg-[rgba(107,114,128,0.4)]'
                        }`}
                      >
                        {t(
                          ratio === '16:9'
                            ? 'transformations.video.landscape'
                            : 'transformations.video.portrait'
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                    {t('transformations.effects.customPrompt.uploader2Title')}
                  </h3>
                  <ImageEditorCanvas
                    onImageSelect={handlePrimaryImageSelect}
                    initialImageUrl={primaryImageUrl}
                    onMaskChange={() => {}}
                    onClearImage={handleClearPrimaryImage}
                    isMaskToolActive={false}
                  />
                </div>
              </>
            ) : selectedTransformation.isMultiImage ? (
              <MultiImageUploader
                onPrimarySelect={handlePrimaryImageSelect}
                onSecondarySelect={handleSecondaryImageSelect}
                primaryImageUrl={primaryImageUrl}
                secondaryImageUrl={secondaryImageUrl}
                onClearPrimary={handleClearPrimaryImage}
                onClearSecondary={handleClearSecondaryImage}
                primaryTitle={
                  selectedTransformation.primaryUploaderTitle
                    ? t(selectedTransformation.primaryUploaderTitle)
                    : undefined
                }
                primaryDescription={
                  selectedTransformation.primaryUploaderDescription
                    ? t(selectedTransformation.primaryUploaderDescription)
                    : undefined
                }
                secondaryTitle={
                  selectedTransformation.secondaryUploaderTitle
                    ? t(selectedTransformation.secondaryUploaderTitle)
                    : undefined
                }
                secondaryDescription={
                  selectedTransformation.secondaryUploaderDescription
                    ? t(selectedTransformation.secondaryUploaderDescription)
                    : undefined
                }
              />
            ) : (
              <>
                {selectedTransformation.prompt === 'CUSTOM' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      {t('transformations.effects.customPrompt.promptLabel')}
                    </label>
                    <textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder={t('transformations.effects.customPrompt.promptPlaceholder')}
                      rows={3}
                      className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] transition-colors placeholder-[var(--text-tertiary)]"
                    />
                  </div>
                )}
                <ImageEditorCanvas
                  onImageSelect={handlePrimaryImageSelect}
                  initialImageUrl={primaryImageUrl}
                  onMaskChange={setMaskDataUrl}
                  onClearImage={handleClearPrimaryImage}
                  isMaskToolActive={activeTool === 'mask'}
                />
                {primaryImageUrl && (
                  <div className="mt-4">
                    <button
                      onClick={toggleMaskTool}
                      className={`w-full flex items-center justify-center gap-2 py-2 px-3 text-sm font-semibold rounded-md transition-colors duration-200 ${
                        activeTool === 'mask'
                          ? 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-[var(--text-on-accent)]'
                          : 'bg-[rgba(107,114,128,0.2)] hover:bg-[rgba(107,114,128,0.4)]'
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z"
                        />
                      </svg>
                      <span>{t('imageEditor.drawMask')}</span>
                    </button>
                  </div>
                )}
              </>
            )}

            <button
              onClick={handleGenerate}
              disabled={isGenerateDisabled}
              className={`w-full mt-6 py-4 px-6 rounded-xl font-bold text-lg shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 ${
                isGenerateDisabled
                  ? 'bg-[var(--bg-secondary)] text-[var(--text-disabled)] cursor-not-allowed'
                  : 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-[var(--text-on-accent)] hover:shadow-[0_0_20px_rgba(255,215,0,0.3)]'
              }`}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner message={loadingMessage || t('app.loading.default')} />
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <span>{t('app.generate')}</span>
                </>
              )}
            </button>
            {error && <ErrorMessage message={error} />}
          </div>
        </div>

        {/* Output Column */}
        <div className="space-y-6">
          <div className="bg-[var(--bg-card)] rounded-xl shadow-lg border border-[var(--border-primary)] p-6 h-full flex flex-col">
            <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">
              {t('app.result')}
            </h3>
            <div className="flex-1 flex flex-col justify-center">
              {generatedContent || selectedTransformation.exampleImage ? (
                <ResultDisplay
                  content={generatedContent || { imageUrl: null, text: null }}
                  onUseImageAsInput={handleUseImageAsInput}
                  onImageClick={handleOpenPreview}
                  originalImageUrl={primaryImageUrl}
                  exampleImage={selectedTransformation.exampleImage}
                />
              ) : (
                <div className="text-center text-[var(--text-tertiary)]">
                  {t('app.resultPlaceholder') || '生成结果将显示在这里'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-[var(--bg-card)] rounded-xl shadow-lg border border-[var(--border-primary)] p-6">
        <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">{t('app.prompt')}</h3>
        <div className="space-y-4">
          <div>
            <p className="p-4 bg-[var(--bg-secondary)] rounded-lg text-[var(--text-primary)] font-mono text-sm whitespace-pre-wrap border border-[var(--border-primary)]">
              {selectedTransformation.prompt === 'CUSTOM'
                ? customPrompt || t('transformations.effects.customPrompt.promptPlaceholder')
                : selectedTransformation.prompt}
            </p>
          </div>
          {selectedTransformation.isTwoStep && selectedTransformation.stepTwoPrompt && (
            <div>
              <span className="block mb-2 font-medium text-[var(--text-secondary)] text-sm">
                {t('app.loading.step2').replace('...', '')}
              </span>
              <p className="p-4 bg-[var(--bg-secondary)] rounded-lg text-[var(--text-primary)] font-mono text-sm whitespace-pre-wrap border border-[var(--border-primary)]">
                {selectedTransformation.stepTwoPrompt}
              </p>
            </div>
          )}
        </div>
      </div>

      <ImagePreviewModal onClose={handleClosePreview} imageUrl={previewImageUrl || ''} />
    </div>
  )
}
