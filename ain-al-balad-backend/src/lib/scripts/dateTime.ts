export const pad = (n: number) => String(n).padStart(2, "0");

export const generateDateTime = (): string => {
  const date = new Date();

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

export const generateDate = (): string => {
  try {
    const date = new Date();

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  } catch (error: any) {
    throw new Error(`Date generation failed: ${error.message ?? error}`, {
      cause: error,
    });
  }
};
export const generateTime = (): string => {
  try {
    const date = new Date();

    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  } catch (error: any) {
    throw new Error(`Time generation failed: ${error.message ?? error}`, {
      cause: error,
    });
  }
};
