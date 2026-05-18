export const patterns = {
  fullName: /^[A-Za-z][A-Za-z\s.'-]{1,79}$/,
  idNumber: /^\d{13}$/,
  accountNumber: /^\d{8,20}$/,
  employeeUsername: /^EMP\d{3,10}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,64}$/,
  amount: /^(?!0+(\.0{1,2})?$)\d{1,9}(\.\d{1,2})?$/,
  beneficiaryName: /^[A-Za-z][A-Za-z\s.'-]{1,79}$/,
  beneficiaryAccount: /^\d{8,24}$/,
  swiftCode: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/,
  bankName: /^[A-Za-z0-9][A-Za-z0-9\s.'-]{1,79}$/
};

export const allowedCurrencies = new Set(['USD', 'EUR', 'GBP', 'ZAR', 'JPY']);
export const allowedProviders = new Set(['SWIFT']);

export function assertMatch(field, value, pattern, message) {
  if (typeof value !== 'string' || !pattern.test(value.trim())) {
    const error = new Error(message || `${field} is invalid.`);
    error.status = 400;
    throw error;
  }
  return value.trim();
}

export function validateCustomerRegistration(body) {
  const fullName = assertMatch('fullName', body.fullName, patterns.fullName, 'Full name may only contain letters, spaces, apostrophes, hyphens and full stops.');
  const idNumber = assertMatch('idNumber', body.idNumber, patterns.idNumber, 'ID number must be exactly 13 digits.');
  const accountNumber = assertMatch('accountNumber', body.accountNumber, patterns.accountNumber, 'Account number must be 8 to 20 digits.');
  const password = assertMatch('password', body.password, patterns.password, 'Password must be 10-64 chars with upper, lower, number and special character.');
  return { fullName, idNumber, accountNumber, password };
}

export function validateLogin(body, role) {
  const usernamePattern = role === 'EMPLOYEE' ? patterns.employeeUsername : patterns.accountNumber;
  const username = assertMatch('username', body.username, usernamePattern, 'Username format is invalid.');
  const password = assertMatch('password', body.password, patterns.password, 'Password format is invalid.');
  return { username, password };
}

export function validatePayment(body) {
  const amountText = assertMatch('amount', String(body.amount ?? ''), patterns.amount, 'Amount must be a positive amount with up to 2 decimals.');
  const amount = Number(amountText);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 999999999.99) {
    const error = new Error('Amount is outside the allowed range.');
    error.status = 400;
    throw error;
  }

  const currency = String(body.currency || '').trim().toUpperCase();
  if (!allowedCurrencies.has(currency)) {
    const error = new Error('Currency is not allowed.');
    error.status = 400;
    throw error;
  }

  const provider = String(body.provider || '').trim().toUpperCase();
  if (!allowedProviders.has(provider)) {
    const error = new Error('Only SWIFT is allowed for this demo portal.');
    error.status = 400;
    throw error;
  }

  return {
    amountCents: Math.round(amount * 100),
    currency,
    provider,
    beneficiaryName: assertMatch('beneficiaryName', body.beneficiaryName, patterns.beneficiaryName, 'Beneficiary name is invalid.'),
    beneficiaryAccount: assertMatch('beneficiaryAccount', body.beneficiaryAccount, patterns.beneficiaryAccount, 'Beneficiary account must be 8 to 24 digits.'),
    swiftCode: assertMatch('swiftCode', String(body.swiftCode || '').toUpperCase(), patterns.swiftCode, 'SWIFT code must be 8 or 11 valid characters.'),
    bankName: assertMatch('bankName', body.bankName, patterns.bankName, 'Bank name is invalid.')
  };
}

export function validatePaymentId(paymentId) {
  const parsed = Number(paymentId);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    const error = new Error('Payment id is invalid.');
    error.status = 400;
    throw error;
  }
  return parsed;
}
