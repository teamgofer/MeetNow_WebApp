export function testWasabiBucket(): Promise<
  | {
      success: boolean;
      error: any;
      message?: never;
      uploadUrl?: never;
      signedUrl?: never;
    }
  | {
      success: boolean;
      message: string;
      uploadUrl: UploadFileResponse;
      signedUrl: string | null;
      error?: never;
    }
>;
export default testWasabiBucket;
