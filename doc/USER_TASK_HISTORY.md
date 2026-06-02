# UserTask Generation History

Banana Shop uses Tale `UserTask` records to persist generation history beyond the current browser session.

## Task Type

The generation history task type is created per Tale app:

- Type name: `Banana Shop Generation`

Set `TALE_GENERATION_TASK_TYPE_ID` only when you need to pin a known task type in the current Tale app. The app validates the configured ID first. If it is empty or unavailable, the app looks for an enabled `Banana Shop Generation` task type and creates one when missing.

Tale UserTask creation uses the task type name (`Banana Shop Generation`) in the `taskType` field. The task type ID is used only to scope attachment types with `refTypeId`.

## Attachment Types

Generation media is stored as task attachments rather than large Base64 strings in `taskInput` or `taskOutput`.

The app automatically reuses or creates these attachment types for `refType=task` and the generation task type:

- `banana_shop_input_image`
- `banana_shop_reference_image`
- `banana_shop_mask_image`
- `banana_shop_intermediate_image`
- `banana_shop_output_image`
- `banana_shop_output_video`

Optional environment variables can pin specific attachment type IDs:

- `TALE_INPUT_IMAGE_ATTACHMENT_TYPE_ID`
- `TALE_REFERENCE_IMAGE_ATTACHMENT_TYPE_ID`
- `TALE_MASK_IMAGE_ATTACHMENT_TYPE_ID`
- `TALE_INTERMEDIATE_IMAGE_ATTACHMENT_TYPE_ID`
- `TALE_OUTPUT_IMAGE_ATTACHMENT_TYPE_ID`
- `TALE_OUTPUT_VIDEO_ATTACHMENT_TYPE_ID`

If these variables are empty, no manual setup is required. Image attachment types allow `png`, `jpg`, `jpeg`, `webp`, and `gif` up to 25 MB. Video attachments allow `mp4`, `webm`, and `mov` up to 200 MB.

## Task Payloads

`taskInput` stores searchable generation metadata:

- `transformationKey`
- `transformationTitle`
- `prompt`
- `providerProfileKey`
- `kind`
- `aspectRatio`
- flags for primary, reference, and mask images
- `schemaVersion`

`taskOutput` stores result metadata and attachment IDs:

- `resultType`
- generation flags for image, video, and text output
- `attachmentIds`
- optional text output
- `schemaVersion`

## Failure Policy

Tale persistence is non-blocking for the creative workflow. If task creation, metadata updates, or attachment uploads fail, the generated result remains visible in the UI and the local history item is marked as save failed.

The user can continue using or downloading the generated result from the current session. A failed history item may not survive a page refresh because it was not fully persisted to Tale.

## Finding Records In Tale

In Tale, filter user tasks by the `Banana Shop Generation` task type. Each task contains the prompt and generation metadata in input/output fields, plus task attachments for original input, reference, mask, intermediate, final image, or video output.
