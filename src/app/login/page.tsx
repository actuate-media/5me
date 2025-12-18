import { Suspense } from 'react';
import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <img
            src="/assets/logos/5me-logo.png"
            alt="5me"
            className="h-16 mx-auto mb-6"
          />
          <h1 className="text-3xl font-bold text-gray-900">Welcome to 5me</h1>
          <p className="mt-2 text-gray-600">
            Sign in with your Actuate Media account
          </p>
        </div>

        <Suspense fallback={<div className="text-center">Loading...</div>}>
          <LoginForm />
        </Suspense>

        <p className="text-center text-sm text-gray-500">
          Only @actuatemedia.com accounts are authorized
        </p>
      </div>
    </div>
  );
}
