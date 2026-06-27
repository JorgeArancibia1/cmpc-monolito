import { SetMetadata } from '@nestjs/common';

export const RAW_RESPONSE_KEY = 'rawResponse';

/** Omite el envoltorio JSON estándar (para respuestas como CSV). */
export const RawResponse = () => SetMetadata(RAW_RESPONSE_KEY, true);
