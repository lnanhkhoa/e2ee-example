import { NextResponse } from 'next/server';

export class ApiResponse<T = any> {
  static success<T>(data: T, status = 200) {
    return NextResponse.json({ success: true, data }, { status });
  }

  static error(message: string, status = 400) {
    return NextResponse.json(
      { success: false, error: message },
      { status }
    );
  }

  static notFound() {
    return this.error('Resource not found', 404);
  }
}
