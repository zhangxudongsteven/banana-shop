# UserTask Generation History

Banana Shop uses Tale `UserTask` records to persist generation history beyond the current browser session.

History writes are shared by the Dashboard workflow, REST API generation endpoints, and the local
MCP server. `/api/v1/history` and `banana_list_history` both read the same Tale `UserTask` records
for the current user.

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

Optional environment variables can pin specific attachment type IDs:

- `TALE_INPUT_IMAGE_ATTACHMENT_TYPE_ID`
- `TALE_REFERENCE_IMAGE_ATTACHMENT_TYPE_ID`
- `TALE_MASK_IMAGE_ATTACHMENT_TYPE_ID`
- `TALE_INTERMEDIATE_IMAGE_ATTACHMENT_TYPE_ID`
- `TALE_OUTPUT_IMAGE_ATTACHMENT_TYPE_ID`

If these variables are empty, no manual setup is required. Image attachment types allow `png`, `jpg`, `jpeg`, `webp`, and `gif` up to 25 MB.

## Task Payloads

`taskInput` stores searchable generation metadata:

- `transformationKey`
- `transformationTitle`
- `prompt`
- `providerProfileKey`
- `kind`
- `source` (`dashboard`, `api`, or `mcp`)
- optional `clientRequestId`
- flags for primary, reference, and mask images
- `schemaVersion`

`taskOutput` stores result metadata and attachment IDs:

- `resultType`
- generation flags for image and text output
- `attachmentIds`
- optional text output
- `schemaVersion`

## Failure Policy

Dashboard saves use a stable `clientRequestId`. History refresh merges remote tasks with session-local results instead of replacing them. Only remote `completed` tasks are labelled saved; `running`/`pending` remain syncing.

Known tasks are resumed by task ID after checking ownership and request ID. A task ID discovered by a concurrent refresh is retained even if the original save request later fails. Existing attachment roles are reused; missing roles are uploaded, and all concurrent uploads finish before failure is reported. A lost create response enters “save unconfirmed”: retries search by request ID and do not create another task when the outcome remains uncertain. The SDK has no atomic idempotency key, so this is not a cross-instance exactly-once guarantee.

Retry payloads exist only in the current Dashboard session. Failed or unconfirmed results should be downloaded before refreshing or closing the page; a before-unload warning is registered while unsaved records exist. No Base64 images are stored in localStorage.

Legacy video records are filtered before resolving attachment URLs. Pagination continues to collect up to 20 image records, or until all pages have been read. Existing cloud records and files are never deleted. Old mask attachments in image records remain readable; the editor no longer creates masks.

Tale persistence is non-blocking for the creative workflow. If task creation, metadata updates, or attachment uploads fail, the generated result remains visible in the UI and the local history item is marked as save failed or save unconfirmed.

The user can continue using or downloading the generated result from the current session. A failed history item may not survive a page refresh because it was not fully persisted to Tale.

## Finding Records In Tale

In Tale, filter user tasks by the `Banana Shop Generation` task type. Each task contains the prompt and generation metadata in input/output fields, plus task attachments for original input, reference, mask, intermediate, final image output.
