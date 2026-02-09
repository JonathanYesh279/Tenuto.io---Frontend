interface LoginPayload {
  email?: string;
  username?: string;
  password: string;
}

export function createLoginPayload(identifier: string, password: string): LoginPayload {
  const payload: LoginPayload = { password };

  if (identifier.includes('@')) {
    payload.email = identifier;
  } else {
    payload.username = identifier;
  }

  return payload;
}

export function getAuthErrorMessage(error: any): string {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.response?.status === 401) {
    return 'שם משתמש או סיסמה שגויים';
  }

  if (error?.response?.status === 429) {
    return 'יותר מדי ניסיונות התחברות. אנא נסה שוב מאוחר יותר';
  }

  if (error?.response?.status >= 500) {
    return 'שגיאת שרת. אנא נסה שוב מאוחר יותר';
  }

  if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network Error')) {
    return 'שגיאת רשת. אנא בדוק את החיבור לאינטרנט';
  }

  return error?.message || 'שגיאה לא צפויה בהתחברות';
}