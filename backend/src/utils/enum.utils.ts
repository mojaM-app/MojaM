const isEnumValue = (enumObject: Record<string, unknown> | ArrayLike<unknown>, value: unknown): boolean => {
  const enumValues = Object.values(enumObject);
  return enumValues.includes(value);
};

export { isEnumValue };
