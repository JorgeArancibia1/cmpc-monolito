import { isSupportedImage } from './image-type';

describe('isSupportedImage', () => {
  it('acepta firmas PNG, JPEG y WebP', () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const webp = Buffer.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
    expect(isSupportedImage(png)).toBe(true);
    expect(isSupportedImage(jpeg)).toBe(true);
    expect(isSupportedImage(webp)).toBe(true);
  });

  it('rechaza buffers que no son imagen o demasiado cortos', () => {
    expect(isSupportedImage(Buffer.from('esto-no-es-imagen'))).toBe(false);
    expect(isSupportedImage(Buffer.from([1, 2, 3]))).toBe(false);
  });
});
