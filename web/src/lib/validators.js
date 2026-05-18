const patterns = {
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

export function validateCustomerRegistration(form) {
  if (!patterns.fullName.test(form.fullName)) return 'Full name is invalid.';
  if (!patterns.idNumber.test(form.idNumber)) return 'ID number must be 13 digits.';
  if (!patterns.accountNumber.test(form.accountNumber)) return 'Account number must be 8 to 20 digits.';
  if (!patterns.password.test(form.password)) return 'Password must have upper, lower, number, special character and at least 10 characters.';
  return '';
}

export function validateLogin(form, role) {
  const usernamePattern = role === 'employee' ? patterns.employeeUsername : patterns.accountNumber;
  if (!usernamePattern.test(form.username)) return role === 'employee' ? 'Employee username must look like EMP001.' : 'Account number must be 8 to 20 digits.';
  if (!patterns.password.test(form.password)) return 'Password format is invalid.';
  return '';
}

export function validatePayment(form) {
  if (!patterns.amount.test(String(form.amount))) return 'Amount must be a valid positive number.';
  if (!['USD', 'EUR', 'GBP', 'ZAR', 'JPY'].includes(form.currency)) return 'Currency is not allowed.';
  if (form.provider !== 'SWIFT') return 'Only SWIFT is allowed in this demo.';
  if (!patterns.beneficiaryName.test(form.beneficiaryName)) return 'Beneficiary name is invalid.';
  if (!patterns.beneficiaryAccount.test(form.beneficiaryAccount)) return 'Beneficiary account is invalid.';
  if (!patterns.bankName.test(form.bankName)) return 'Bank name is invalid.';
  if (!patterns.swiftCode.test(String(form.swiftCode).toUpperCase())) return 'SWIFT code must be 8 or 11 valid characters.';
  return '';
}
