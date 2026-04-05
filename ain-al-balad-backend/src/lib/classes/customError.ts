export default class CustomError extends Error {
  public readonly statusCode: string | number;

  constructor(message: string, code: string | number = 500) {
    super(message);
    this.name = "CustomError"; // Best practice: give the custom error a distinct name
    this.statusCode = code;
    // Set the prototype explicitly to make 'instanceof' work correctly
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}
