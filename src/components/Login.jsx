import { useState } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { GraduationCap, LogIn } from 'lucide-react';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      toast.success('Successfully logged in!');
    } catch (error) {
      toast.error(error.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 glass-card p-10 rounded-2xl animate-fade-in-up">
        <div>
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-violet-600 dark:from-indigo-500 to-purple-500 dark:to-violet-500 rounded-2xl flex items-center justify-center shadow-lg transform -translate-y-4">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-2 text-center text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 tracking-tight">
            Teacher Portal
          </h2>
          <p className="mt-3 text-center text-sm text-gray-500 dark:text-slate-300 font-medium">
            Sign in to manage attendance
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-200 dark:border-gray-700 placeholder-gray-500 text-gray-800 dark:text-gray-50 dark:bg-[#2A2A2A] focus:outline-none focus:ring-violet-600 dark:focus:ring-indigo-500 focus:border-violet-600 dark:focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-200 dark:border-gray-700 placeholder-gray-500 text-gray-800 dark:text-gray-50 dark:bg-[#2A2A2A] focus:outline-none focus:ring-violet-600 dark:focus:ring-indigo-500 focus:border-violet-600 dark:focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-violet-600 dark:bg-indigo-500 hover:bg-violet-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-600 dark:focus:ring-indigo-500 disabled:opacity-50 transition-colors"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <LogIn className="h-5 w-5 text-violet-600 dark:text-indigo-500 group-hover:text-blue-400" aria-hidden="true" />
              </span>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
