import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { api, setCsrfToken, getCsrfToken, clearCsrfToken } from './lib/api.js';
import { validateCustomerRegistration, validateLogin, validatePayment } from './lib/validators.js';

const routes = {
  home: 'home',
  register: 'register',
  customerLogin: 'customerLogin',
  customer: 'customer',
  newPayment: 'newPayment',
  employeeLogin: 'employeeLogin',
  employee: 'employee'
};

function App() {
  const [route, setRoute] = useState(routes.home);
  const [user, setUser] = useState(null);
  const [notice, setNotice] = useState('');

  async function refreshMe() {
    try {
      const data = await api('/api/auth/me');
      setUser(data.user);
      if (data.user.role === 'CUSTOMER') setRoute(routes.customer);
      if (data.user.role === 'EMPLOYEE') setRoute(routes.employee);
    } catch {
      setUser(null);
    }
  }

  useEffect(() => {
    if (getCsrfToken()) refreshMe();
  }, []);

  async function logout() {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } catch { /* ignore expired session */ }
    clearCsrfToken();
    setUser(null);
    setRoute(routes.home);
    setNotice('You have been logged out.');
  }

  return (
    <div>
      <Header user={user} setRoute={setRoute} logout={logout} />
      <main className="container">
        {notice && <div className="notice">{notice}</div>}
        {route === routes.home && <Home setRoute={setRoute} />}
        {route === routes.register && <Register setUser={setUser} setRoute={setRoute} setNotice={setNotice} />}
        {route === routes.customerLogin && <Login role="customer" setUser={setUser} setRoute={setRoute} setNotice={setNotice} />}
        {route === routes.employeeLogin && <Login role="employee" setUser={setUser} setRoute={setRoute} setNotice={setNotice} />}
        {route === routes.customer && <CustomerDashboard setRoute={setRoute} />}
        {route === routes.newPayment && <NewPayment setRoute={setRoute} />}
        {route === routes.employee && <EmployeeDashboard />}
      </main>
    </div>
  );
}

function Header({ user, setRoute, logout }) {
  return (
    <header className="header">
      <button className="brand" onClick={() => setRoute(routes.home)}>SecurePay International</button>
      <nav>
        {!user && <button onClick={() => setRoute(routes.customerLogin)}>Customer Login</button>}
        {!user && <button onClick={() => setRoute(routes.employeeLogin)}>Employee Login</button>}
        {!user && <button className="primarySmall" onClick={() => setRoute(routes.register)}>Register</button>}
        {user?.role === 'CUSTOMER' && <button onClick={() => setRoute(routes.customer)}>Customer Dashboard</button>}
        {user?.role === 'CUSTOMER' && <button onClick={() => setRoute(routes.newPayment)}>New Payment</button>}
        {user?.role === 'EMPLOYEE' && <button onClick={() => setRoute(routes.employee)}>Employee Portal</button>}
        {user && <button onClick={logout}>Logout</button>}
      </nav>
    </header>
  );
}

function Home({ setRoute }) {
  return (
    <section className="hero card">
      <div>
        <p className="eyebrow">APDS7311w secure payments demo</p>
        <h1>Secure International Payments Portal</h1>
        <p>
          This demo shows a customer registering, logging in, capturing a SWIFT payment,
          and a bank employee verifying it before it is sent to a SWIFT handoff screen.
        </p>
        <div className="actions">
          <button className="primary" onClick={() => setRoute(routes.register)}>Register Customer</button>
          <button onClick={() => setRoute(routes.employeeLogin)}>Open Employee Portal</button>
        </div>
      </div>
      <div className="securityBox">
        <h3>Security used</h3>
        <ul>
          <li>HTTPS with local certificate</li>
          <li>Password hashing and salting</li>
          <li>Regex whitelist validation</li>
          <li>Secure HttpOnly session cookie</li>
          <li>CSRF token check</li>
          <li>Rate limiting and security headers</li>
        </ul>
      </div>
    </section>
  );
}

function Register({ setUser, setRoute, setNotice }) {
  const [form, setForm] = useState({ fullName: '', idNumber: '', accountNumber: '', password: '' });
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    const validation = validateCustomerRegistration(form);
    if (validation) return setError(validation);
    try {
      const data = await api('/api/auth/register-customer', { method: 'POST', body: form, skipCsrf: true });
      setCsrfToken(data.csrfToken);
      setUser(data.user);
      setNotice('Customer registered and logged in.');
      setRoute(routes.customer);
    } catch (err) {
      setError(err.message);
    }
  }

  return <AuthCard title="Customer Registration" error={error} onSubmit={submit}>
    <Input label="Full name" value={form.fullName} onChange={v => setForm({ ...form, fullName: v })} placeholder="Mpho Dlamini" />
    <Input label="ID number" value={form.idNumber} onChange={v => setForm({ ...form, idNumber: v })} placeholder="13 digits" />
    <Input label="Account number" value={form.accountNumber} onChange={v => setForm({ ...form, accountNumber: v })} placeholder="8 to 20 digits" />
    <Input label="Password" type="password" value={form.password} onChange={v => setForm({ ...form, password: v })} placeholder="Example@12345" />
    <button className="primary" type="submit">Create secure account</button>
  </AuthCard>;
}

function Login({ role, setUser, setRoute, setNotice }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const title = role === 'employee' ? 'Employee Login' : 'Customer Login';
  const endpoint = role === 'employee' ? '/api/auth/login-employee' : '/api/auth/login-customer';

  async function submit(e) {
    e.preventDefault();
    const validation = validateLogin(form, role);
    if (validation) return setError(validation);
    try {
      const data = await api(endpoint, { method: 'POST', body: form, skipCsrf: true });
      setCsrfToken(data.csrfToken);
      setUser(data.user);
      setNotice(`${title} successful.`);
      setRoute(role === 'employee' ? routes.employee : routes.customer);
    } catch (err) {
      setError(err.message);
    }
  }

  return <AuthCard title={title} error={error} onSubmit={submit}>
    {role === 'employee' && <p className="hint">Demo employee: EMP001 / Employee@12345</p>}
    <Input label={role === 'employee' ? 'Employee username' : 'Account number'} value={form.username} onChange={v => setForm({ ...form, username: v })} />
    <Input label="Password" type="password" value={form.password} onChange={v => setForm({ ...form, password: v })} />
    <button className="primary" type="submit">Login</button>
  </AuthCard>;
}

function CustomerDashboard({ setRoute }) {
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState('');

  async function load() {
    try {
      const data = await api('/api/payments/my');
      setPayments(data.payments);
    } catch (err) {
      setError(err.message);
    }
  }
  useEffect(() => { load(); }, []);

  return (
    <section>
      <div className="pageTitle">
        <div>
          <p className="eyebrow">Customer portal</p>
          <h2>My International Payments</h2>
        </div>
        <button className="primary" onClick={() => setRoute(routes.newPayment)}>New SWIFT Payment</button>
      </div>
      {error && <div className="error">{error}</div>}
      <PaymentTable payments={payments} />
    </section>
  );
}

function NewPayment({ setRoute }) {
  const [form, setForm] = useState({
    amount: '', currency: 'USD', provider: 'SWIFT', beneficiaryName: '', beneficiaryAccount: '', swiftCode: '', bankName: ''
  });
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    const validation = validatePayment(form);
    if (validation) return setError(validation);
    try {
      await api('/api/payments', { method: 'POST', body: form });
      setRoute(routes.customer);
    } catch (err) {
      setError(err.message);
    }
  }

  return <AuthCard title="Capture International Payment" error={error} onSubmit={submit}>
    <div className="grid2">
      <Input label="Amount" value={form.amount} onChange={v => setForm({ ...form, amount: v })} placeholder="1500.00" />
      <Select label="Currency" value={form.currency} onChange={v => setForm({ ...form, currency: v })} options={['USD', 'EUR', 'GBP', 'ZAR', 'JPY']} />
    </div>
    <Select label="Provider" value={form.provider} onChange={v => setForm({ ...form, provider: v })} options={['SWIFT']} />
    <Input label="Beneficiary name" value={form.beneficiaryName} onChange={v => setForm({ ...form, beneficiaryName: v })} placeholder="Global Supplier Ltd" />
    <Input label="Beneficiary account" value={form.beneficiaryAccount} onChange={v => setForm({ ...form, beneficiaryAccount: v })} placeholder="8 to 24 digits" />
    <Input label="Beneficiary bank name" value={form.bankName} onChange={v => setForm({ ...form, bankName: v })} placeholder="Example International Bank" />
    <Input label="SWIFT code" value={form.swiftCode} onChange={v => setForm({ ...form, swiftCode: v.toUpperCase() })} placeholder="ABCDEF12 or ABCDEF12XXX" />
    <button className="primary" type="submit">Pay Now</button>
  </AuthCard>;
}

function EmployeeDashboard() {
  const [payments, setPayments] = useState([]);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');
  const [swiftRef, setSwiftRef] = useState('');

  async function load(selected = filter) {
    try {
      const qs = selected ? `?status=${selected}` : '';
      const data = await api(`/api/employee/payments${qs}`);
      setPayments(data.payments);
    } catch (err) {
      setError(err.message);
    }
  }
  useEffect(() => { load(); }, []);

  async function verify(paymentId) {
    try {
      await api(`/api/employee/payments/${paymentId}/verify`, { method: 'POST' });
      await load();
    } catch (err) { setError(err.message); }
  }

  async function sendToSwift(paymentId) {
    try {
      const data = await api(`/api/employee/payments/${paymentId}/send-to-swift`, { method: 'POST' });
      setSwiftRef(data.swiftReference);
      await load();
    } catch (err) { setError(err.message); }
  }

  return (
    <section>
      <div className="pageTitle">
        <div>
          <p className="eyebrow">Employee internal portal</p>
          <h2>Payments Waiting for Verification</h2>
        </div>
        <div className="inlineControl">
          <Select label="Filter" value={filter} onChange={v => { setFilter(v); load(v); }} options={['', 'PENDING', 'VERIFIED', 'SENT_TO_SWIFT']} />
        </div>
      </div>
      {error && <div className="error">{error}</div>}
      {swiftRef && <div className="notice">SWIFT screen opened and payment was sent. Reference: {swiftRef}</div>}
      <EmployeePaymentCards payments={payments} verify={verify} sendToSwift={sendToSwift} />
    </section>
  );
}

function EmployeePaymentCards({ payments, verify, sendToSwift }) {
  if (!payments.length) return <div className="empty card">No payments found.</div>;
  return <div className="cards">
    {payments.map(payment => <article className="card paymentCard" key={payment.id}>
      <div className="statusRow">
        <h3>Payment #{payment.id}</h3>
        <span className={`badge ${payment.status.toLowerCase()}`}>{payment.status}</span>
      </div>
      <p><strong>Customer:</strong> {payment.customerName}</p>
      <p><strong>Amount:</strong> {payment.currency} {payment.amount}</p>
      <p><strong>Beneficiary:</strong> {payment.beneficiaryName}</p>
      <p><strong>Account:</strong> {payment.beneficiaryAccount}</p>
      <p><strong>Bank:</strong> {payment.bankName}</p>
      <p><strong>SWIFT:</strong> {payment.swiftCode}</p>
      <div className="actions">
        {payment.status === 'PENDING' && <button className="primary" onClick={() => verify(payment.id)}>Verify account and SWIFT</button>}
        {payment.status === 'VERIFIED' && <button className="primary" onClick={() => sendToSwift(payment.id)}>Open SWIFT and send</button>}
      </div>
    </article>)}
  </div>;
}

function PaymentTable({ payments }) {
  if (!payments.length) return <div className="empty card">No payments captured yet.</div>;
  return <div className="tableWrap card">
    <table>
      <thead>
        <tr><th>ID</th><th>Beneficiary</th><th>Amount</th><th>SWIFT</th><th>Status</th><th>Date</th></tr>
      </thead>
      <tbody>
        {payments.map(p => <tr key={p.id}>
          <td>{p.id}</td><td>{p.beneficiaryName}</td><td>{p.currency} {p.amount}</td><td>{p.swiftCode}</td><td><span className={`badge ${p.status.toLowerCase()}`}>{p.status}</span></td><td>{p.createdAt}</td>
        </tr>)}
      </tbody>
    </table>
  </div>;
}

function AuthCard({ title, error, children, onSubmit }) {
  return <form className="card formCard" onSubmit={onSubmit} noValidate>
    <h2>{title}</h2>
    {error && <div className="error">{error}</div>}
    {children}
  </form>;
}

function Input({ label, value, onChange, type = 'text', placeholder = '' }) {
  return <label className="field"><span>{label}</span><input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} autoComplete="off" /></label>;
}

function Select({ label, value, onChange, options }) {
  return <label className="field"><span>{label}</span><select value={value} onChange={e => onChange(e.target.value)}>{options.map(o => <option value={o} key={o}>{o || 'All statuses'}</option>)}</select></label>;
}

createRoot(document.getElementById('root')).render(<App />);
