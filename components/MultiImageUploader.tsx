'use client'

import React from 'react'
import { useTranslation } from '@/i18n/context'
import ImageUploader from '@/components/ImageUploader'

interface MultiImageUploaderProps {
  onPrimarySelect: (file: File, dataUrl: string) => void
  onSecondarySelect: (file: File, dataUrl: string) => void
  primaryImageUrl: string | null
  secondaryImageUrl: string | null
  onClearPrimary: () => void
  onClearSecondary: () => void
  primaryTitle?: string
  primaryDescription?: string
  secondaryTitle?: string
  secondaryDescription?: string
  disabled?: boolean
  primaryBytes?: number
  secondaryBytes?: number
  onPrimaryBusyChange?: (busy: boolean) => void
  onSecondaryBusyChange?: (busy: boolean) => void
}

export default function MultiImageUploader(props: MultiImageUploaderProps) {
  const { t } = useTranslation()
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <ImageUploader
        title={props.primaryTitle ?? t('transformations.pose.uploader1Title')}
        description={props.primaryDescription ?? t('transformations.pose.uploader1Desc')}
        imageUrl={props.primaryImageUrl}
        onImageSelect={props.onPrimarySelect}
        onClear={props.onClearPrimary}
        disabled={props.disabled}
        otherImageBytes={props.secondaryBytes}
        onBusyChange={props.onPrimaryBusyChange}
      />
      <ImageUploader
        title={props.secondaryTitle ?? t('transformations.pose.uploader2Title')}
        description={props.secondaryDescription ?? t('transformations.pose.uploader2Desc')}
        imageUrl={props.secondaryImageUrl}
        onImageSelect={props.onSecondarySelect}
        onClear={props.onClearSecondary}
        disabled={props.disabled}
        otherImageBytes={props.primaryBytes}
        onBusyChange={props.onSecondaryBusyChange}
      />
    </div>
  )
}
