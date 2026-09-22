'use client'

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, ImagePlus, Layers3, Sparkles, Zap } from 'lucide-react'
import { findTransformationByKey } from '@/lib/constants'
import { generateImageAction, editImageAction } from '@/actions/image-actions'
import type { GeneratedContent, RecordGenerationHistoryInput } from '@/types'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorMessage from '@/components/ErrorMessage'
import ProviderSelector from '@/components/ProviderSelector'
import ImageUploader from '@/components/ImageUploader'
import MultiImageUploader from '@/components/MultiImageUploader'
import { embedWatermark, loadImage, resizeImageToMatch } from '@/utils/fileUtils'
import { loadImageInput } from '@/utils/imageInput'
import { useTranslation } from '@/i18n/context'
import { useHistory } from '@/contexts/HistoryContext'
import { Button } from '@/components/ui/button'

const ResultDisplay = dynamic(() => import('@/components/ResultDisplay'), { ssr: false })
const ImagePreviewModal = dynamic(() => import('@/components/ImagePreviewModal'), { ssr: false })
const IMAGE_EDIT_PROVIDER_PROFILES = [
  {
    key: 'defaultImageEdit',
    titleKey: 'providerSelector.profiles.volcengineImageEdit.title',
    descriptionKey: 'providerSelector.profiles.volcengineImageEdit.description',
  },
  {
    key: 'aliyunImageEdit',
    titleKey: 'providerSelector.profiles.aliyunImageEdit.title',
    descriptionKey: 'providerSelector.profiles.aliyunImageEdit.description',
  },
]
type GenerationStatus = 'idle' | 'generating' | 'success' | 'error'
interface ResultSnapshot {
  content: GeneratedContent
  originalImageUrl: string | null
  revision: number
}

export default function GenerationPage() {
  const params = useParams()
  return <GenerationWorkspace key={params.style as string} />
}

function GenerationWorkspace() {
  const router = useRouter()
  const params = useParams()
  const { t } = useTranslation()
  const {
    recordHistoryItem,
    pendingImageInput,
    setPendingImageInput,
    isGenerating,
    setIsGenerating,
  } = useHistory()
  const selectedTransformation = findTransformationByKey(params.style as string)
  const [primaryImageUrl, setPrimaryImageUrl] = useState<string | null>(null)
  const [primaryFile, setPrimaryFile] = useState<File | null>(null)
  const [secondaryImageUrl, setSecondaryImageUrl] = useState<string | null>(null)
  const [secondaryFile, setSecondaryFile] = useState<File | null>(null)
  const [result, setResult] = useState<ResultSnapshot | null>(null)
  const [status, setStatus] = useState<GenerationStatus>('idle')
  const [loadingMessage, setLoadingMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [customPrompt, setCustomPrompt] = useState('')
  const [selectedProviderProfileKey, setSelectedProviderProfileKey] = useState('')
  const [revision, setRevision] = useState(0)
  const [primaryReading, setPrimaryReading] = useState(false)
  const [secondaryReading, setSecondaryReading] = useState(false)
  const [importing, setImporting] = useState(false)
  const submitting = useRef(false)
  const importingRef = useRef(false)
  const importAttempt = useRef<string | null>(null)
  const importRequest = useRef(0)
  const busy = isGenerating || importing
  const isLoading = status === 'generating'

  useEffect(() => {
    if (!selectedTransformation) router.replace('/dashboard')
  }, [selectedTransformation, router])
  useEffect(
    () => () => {
      importRequest.current++
    },
    []
  )
  const providerProfileOptions = useMemo(
    () =>
      selectedTransformation?.isTextToImage
        ? selectedTransformation.providerProfiles || []
        : IMAGE_EDIT_PROVIDER_PROFILES,
    [selectedTransformation]
  )
  useEffect(() => {
    setSelectedProviderProfileKey((key) =>
      providerProfileOptions.some((option) => option.key === key)
        ? key
        : providerProfileOptions[0]?.key || 'defaultImageEdit'
    )
  }, [providerProfileOptions])

  const markInputChanged = useCallback(() => {
    setRevision((value) => value + 1)
    setError(null)
    setStatus('idle')
  }, [])
  const importPendingImage = useCallback(
    async (url: string) => {
      if (isGenerating || submitting.current || importingRef.current) return
      importingRef.current = true
      setImporting(true)
      setImportError(null)
      const request = ++importRequest.current
      try {
        const loaded = await loadImageInput(url)
        if (request !== importRequest.current) return
        setPrimaryFile(loaded.file)
        setPrimaryImageUrl(loaded.dataUrl)
        setSecondaryFile(null)
        setSecondaryImageUrl(null)
        markInputChanged()
        setPendingImageInput((current) => (current === url ? null : current))
      } catch (cause) {
        if (request === importRequest.current)
          setImportError(
            cause instanceof Error ? t(cause.message) : t('app.error.useAsInputFailed')
          )
      } finally {
        importingRef.current = false
        if (request === importRequest.current) setImporting(false)
      }
    },
    [isGenerating, markInputChanged, setPendingImageInput, t]
  )

  useEffect(() => {
    if (!pendingImageInput) {
      importAttempt.current = null
      return
    }
    if (
      selectedTransformation?.key !== 'customPrompt' ||
      busy ||
      importAttempt.current === pendingImageInput
    )
      return
    importAttempt.current = pendingImageInput
    void importPendingImage(pendingImageInput)
  }, [pendingImageInput, selectedTransformation?.key, busy, importPendingImage])

  const handleContinueEditing = useCallback(
    (url: string) => {
      if (isGenerating || submitting.current || importingRef.current) return
      setPendingImageInput(url)
      router.push('/dashboard/customPrompt')
    },
    [isGenerating, setPendingImageInput, router]
  )

  const shouldRenderPromptInput =
    selectedTransformation?.isTextToImage || selectedTransformation?.prompt === 'CUSTOM'
  const missingInput = !selectedTransformation
    ? ''
    : !selectedTransformation.isTextToImage && !primaryImageUrl
      ? t('app.error.uploadAndSelect')
      : selectedTransformation.isMultiImage &&
          !selectedTransformation.isSecondaryOptional &&
          !secondaryImageUrl
        ? t('app.error.uploadBoth')
        : shouldRenderPromptInput && !customPrompt.trim()
          ? t('app.error.enterPrompt')
          : ''

  const handleGenerate = async () => {
    if (
      !selectedTransformation ||
      submitting.current ||
      busy ||
      primaryReading ||
      secondaryReading ||
      missingInput
    )
      return
    submitting.current = true
    setIsGenerating(true)
    setStatus('generating')
    setError(null)
    setLoadingMessage(t('app.loading.default'))
    // Capture all inputs before awaiting; comparison and history always use this snapshot.
    const snapshot = {
      primaryImageUrl,
      secondaryImageUrl,
      revision,
      profileKey: selectedProviderProfileKey,
      prompt: shouldRenderPromptInput ? customPrompt.trim() : selectedTransformation.prompt || '',
      transformation: selectedTransformation,
    }
    try {
      let content: GeneratedContent
      let kind: RecordGenerationHistoryInput['kind']
      if (snapshot.transformation.isTextToImage) {
        const response = await generateImageAction({
          prompt: snapshot.prompt,
          transformationKey: snapshot.transformation.key,
          profileKey: snapshot.profileKey,
        })
        if (!response.success || !response.data)
          throw new Error(response.error || t('app.error.unknown'))
        content = response.data
        kind = 'text-to-image'
      } else {
        const parse = (url: string) => ({
          base64: url.split(',')[1],
          mimeType: url.split(';')[0].split(':')[1],
        })
        const primary = parse(snapshot.primaryImageUrl!)
        let secondary = snapshot.secondaryImageUrl ? parse(snapshot.secondaryImageUrl) : null
        if (snapshot.transformation.isTwoStep) {
          setLoadingMessage(t('app.loading.step1'))
          const first = await editImageAction(
            primary.base64,
            primary.mimeType,
            snapshot.prompt,
            null,
            null,
            snapshot.profileKey
          )
          if (!first.success || !first.data?.imageUrl)
            throw new Error(first.error || t('app.error.unknown'))
          setLoadingMessage(t('app.loading.step2'))
          if (snapshot.secondaryImageUrl) {
            const primaryImage = await loadImage(snapshot.primaryImageUrl!)
            secondary = parse(await resizeImageToMatch(snapshot.secondaryImageUrl, primaryImage))
          }
          const lineArt = parse(first.data.imageUrl)
          const second = await editImageAction(
            lineArt.base64,
            lineArt.mimeType,
            snapshot.transformation.stepTwoPrompt!,
            null,
            secondary,
            snapshot.profileKey
          )
          if (!second.success || !second.data)
            throw new Error(second.error || t('app.error.unknown'))
          content = { ...second.data, secondaryImageUrl: first.data.imageUrl }
          kind = 'two-step-image-edit'
        } else {
          const response = await editImageAction(
            primary.base64,
            primary.mimeType,
            snapshot.prompt,
            null,
            snapshot.transformation.isMultiImage ? secondary : null,
            snapshot.profileKey
          )
          if (!response.success || !response.data)
            throw new Error(response.error || t('app.error.unknown'))
          content = response.data
          kind = snapshot.transformation.isMultiImage ? 'multi-image-edit' : 'image-edit'
        }
        if (content.imageUrl)
          content = { ...content, imageUrl: await embedWatermark(content.imageUrl, 'Banana Shop') }
      }
      setResult({
        content,
        originalImageUrl: snapshot.transformation.isTextToImage ? null : snapshot.primaryImageUrl,
        revision: snapshot.revision,
      })
      setStatus('success')
      void recordHistoryItem(content, {
        transformationKey: snapshot.transformation.key,
        transformationTitle: t(snapshot.transformation.titleKey),
        prompt: snapshot.prompt,
        providerProfileKey: snapshot.profileKey,
        kind,
        source: 'dashboard',
        inputs: {
          primaryImageUrl: snapshot.primaryImageUrl,
          referenceImageUrl: snapshot.secondaryImageUrl,
        },
        outputs: {
          imageUrl: content.imageUrl,
          secondaryImageUrl: content.secondaryImageUrl,
          text: content.text,
        },
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('app.error.unknown'))
      setStatus('error')
    } finally {
      submitting.current = false
      setIsGenerating(false)
      setLoadingMessage('')
    }
  }

  const handleClosePreview = useCallback(() => setPreviewImageUrl(null), [])
  if (!selectedTransformation) return null
  const previousResult = result && (isLoading || status === 'error' || result.revision !== revision)

  return (
    <div className="container mx-auto max-w-7xl p-4 pb-24">
      <div className="studio-surface mb-6 rounded-lg p-5">
        <div className="flex items-start gap-4">
          <Button
            type="button"
            size="icon"
            variant="secondary"
            onClick={() => router.push('/dashboard')}
            aria-label={t('app.back')}
          >
            <ChevronLeft />
          </Button>
          <div>
            <div className="process-pill mb-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold">
              <Sparkles />
              {t('app.studioWorkflow')}
            </div>
            <h2 className="text-2xl font-bold">{t(selectedTransformation.titleKey)}</h2>
            {selectedTransformation.descriptionKey && (
              <p className="mt-2 text-muted-foreground">
                {t(selectedTransformation.descriptionKey)}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.82fr_1.18fr]">
        <div className="studio-surface self-start rounded-lg p-5">
          <h3 className="mb-5 flex items-center gap-2 text-lg font-semibold">
            <Layers3 />
            {t('app.input')}
          </h3>
          {importing && (
            <p role="status" className="mb-4 text-sm">
              {t('imageEditor.reading')}
            </p>
          )}
          {importError && (
            <div role="alert" className="mb-4 flex flex-col gap-2 text-sm text-[var(--text-error)]">
              <p>{importError}</p>
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => pendingImageInput && void importPendingImage(pendingImageInput)}
              >
                {t('imageEditor.retryImport')}
              </Button>
            </div>
          )}
          <fieldset disabled={busy} className="flex min-w-0 flex-col gap-4">
            <legend className="sr-only">{t('app.input')}</legend>
            <ProviderSelector
              options={providerProfileOptions}
              selectedKey={selectedProviderProfileKey}
              disabled={busy}
              onSelect={(key) => {
                if (!busy) {
                  setSelectedProviderProfileKey(key)
                  markInputChanged()
                }
              }}
            />
            {shouldRenderPromptInput && (
              <div>
                <label htmlFor="generation-prompt" className="mb-2 block text-sm font-medium">
                  {t('transformations.effects.customPrompt.promptLabel')}
                </label>
                <textarea
                  id="generation-prompt"
                  value={customPrompt}
                  onChange={(event) => {
                    if (!busy) {
                      setCustomPrompt(event.target.value)
                      markInputChanged()
                    }
                  }}
                  rows={4}
                  placeholder={t(
                    selectedTransformation.key === 'glmImage'
                      ? 'transformations.effects.glmImage.promptPlaceholder'
                      : 'transformations.effects.customPrompt.promptPlaceholder'
                  )}
                  className="w-full rounded-lg border border-border bg-[var(--bg-secondary)] p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                />
              </div>
            )}
            {!selectedTransformation.isTextToImage &&
              (selectedTransformation.isMultiImage ? (
                <MultiImageUploader
                  disabled={busy}
                  primaryImageUrl={primaryImageUrl}
                  secondaryImageUrl={secondaryImageUrl}
                  primaryBytes={primaryFile?.size}
                  secondaryBytes={secondaryFile?.size}
                  onPrimaryBusyChange={setPrimaryReading}
                  onSecondaryBusyChange={setSecondaryReading}
                  onPrimarySelect={(file, url) => {
                    if (!busy) {
                      setPrimaryFile(file)
                      setPrimaryImageUrl(url)
                      markInputChanged()
                    }
                  }}
                  onSecondarySelect={(file, url) => {
                    if (!busy) {
                      setSecondaryFile(file)
                      setSecondaryImageUrl(url)
                      markInputChanged()
                    }
                  }}
                  onClearPrimary={() => {
                    if (!busy) {
                      setPrimaryFile(null)
                      setPrimaryImageUrl(null)
                      markInputChanged()
                    }
                  }}
                  onClearSecondary={() => {
                    if (!busy) {
                      setSecondaryFile(null)
                      setSecondaryImageUrl(null)
                      markInputChanged()
                    }
                  }}
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
                <ImageUploader
                  imageUrl={primaryImageUrl}
                  disabled={busy}
                  onBusyChange={setPrimaryReading}
                  onImageSelect={(file, url) => {
                    if (!busy) {
                      setPrimaryFile(file)
                      setPrimaryImageUrl(url)
                      markInputChanged()
                    }
                  }}
                  onClear={() => {
                    if (!busy) {
                      setPrimaryFile(null)
                      setPrimaryImageUrl(null)
                      markInputChanged()
                    }
                  }}
                />
              ))}
          </fieldset>
          <Button
            type="button"
            onClick={() => void handleGenerate()}
            disabled={busy || primaryReading || secondaryReading || Boolean(missingInput)}
            size="lg"
            className="mt-6 h-12 w-full text-base font-bold"
          >
            <Zap />
            {isLoading ? t('app.generating') : t('app.generateImage')}
          </Button>
          {!busy && missingInput && (
            <p className="mt-2 text-sm text-muted-foreground">{missingInput}</p>
          )}
          {isGenerating && (
            <p className="mt-2 text-sm text-muted-foreground">{t('app.inputsLocked')}</p>
          )}
          {error && <ErrorMessage message={error} />}
        </div>
        <div
          className="studio-surface flex min-h-[400px] flex-col rounded-lg p-5 lg:min-h-[680px]"
          aria-busy={isLoading}
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <ImagePlus />
              {previousResult ? t('app.previousResult') : t('app.result')}
            </h3>
            {result?.content.imageUrl && result.originalImageUrl && (
              <span className="cyan-pill rounded-full px-3 py-1 text-xs">
                {t('app.compareReady')}
              </span>
            )}
          </div>
          <div role="status" aria-live="polite" className="mb-3 text-sm">
            {isLoading ? (
              <LoadingSpinner message={loadingMessage} />
            ) : status === 'success' ? (
              t('app.generationComplete')
            ) : status === 'error' ? (
              t('app.generationFailed')
            ) : null}
          </div>
          {result ? (
            <ResultDisplay
              key={result.content.imageUrl || result.content.text}
              content={result.content}
              originalImageUrl={result.originalImageUrl}
              onUseImageAsInput={handleContinueEditing}
              onImageClick={setPreviewImageUrl}
              disabled={busy}
            />
          ) : (
            !isLoading &&
            (selectedTransformation.exampleImage ? (
              <div className="relative flex flex-1 items-center justify-center">
                <img
                  src={selectedTransformation.exampleImage}
                  alt={t('app.exampleResult')}
                  className="max-h-[600px] max-w-full object-contain"
                />
                <span className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
                  {t('app.exampleResult')}
                </span>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-muted-foreground">
                <Sparkles />
                <p>{t('app.emptyResultHint')}</p>
                <p className="text-sm">{t('app.emptyResultActionHint')}</p>
              </div>
            ))
          )}
        </div>
      </div>
      <details className="studio-surface mt-6 rounded-lg p-5">
        <summary className="cursor-pointer text-sm font-semibold">{t('app.promptDetails')}</summary>
        <p className="mt-4 whitespace-pre-wrap break-words text-sm text-muted-foreground">
          {shouldRenderPromptInput
            ? customPrompt || t('transformations.effects.customPrompt.promptPlaceholder')
            : selectedTransformation.prompt}
        </p>
        {selectedTransformation.stepTwoPrompt && (
          <p className="mt-4 whitespace-pre-wrap text-sm text-muted-foreground">
            {selectedTransformation.stepTwoPrompt}
          </p>
        )}
      </details>
      <ImagePreviewModal onClose={handleClosePreview} imageUrl={previewImageUrl} />
    </div>
  )
}
