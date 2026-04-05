export const hash = async (pass: string) => {
  return await Bun.password.hash(pass);
};

export const verify = async (pass: string, hash: string) => {
  return await Bun.password.verify(pass, hash);
};
