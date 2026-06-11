import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Login = () => {
  const { isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState('email'); // 'email' or 'verify'

  // If already authenticated (e.g. onAuthStateChange fired), redirect via React Router
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }



  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        },
      });

      if (error) {
        if (error.message?.includes('Email rate limit') || error.status === 429) {
          setError('發送過於頻繁，請稍後再試（每小時限制 4 封）');
        } else if (error.message?.includes('Signups not allowed') || error.message?.includes('not allowed')) {
          setError('此電郵未註冊，請聯繫管理員');
        } else {
          setError(error.message || '發送驗證碼失敗');
        }
      } else {
        setSuccess('驗證碼已發送至您的電郵，請查收。');
        setStep('verify');
      }
    } catch (err) {
      setError('郵件服務暫時無法使用，請稍後再試或聯繫管理員');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        setSuccess('驗證成功，正在跳轉...');
        // onAuthStateChange will set isAuthenticated=true, then Navigate will redirect
        // No need for window.location.href which causes full reload race condition
      }
    } catch (err) {
      setError('驗證時發生錯誤，請稍後再試');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        },
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess('驗證碼已重新發送，請查收電郵。');
      }
    } catch (err) {
      setError('重新發送時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">員工系統登入</CardTitle>
          <CardDescription>
            {step === 'email' ? '請輸入您的電郵地址，我們會發送驗證碼給您' : '請輸入發送到電郵的驗證碼'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'email' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">電郵地址</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
              {success && (
                <p className="text-sm text-green-600">{success}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '發送中...' : '發送驗證碼'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-display">電郵地址</Label>
                <Input
                  id="email-display"
                  type="email"
                  value={email}
                  disabled
                  className="bg-slate-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="otp">驗證碼</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="輸入6位數驗證碼"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  required
                  autoFocus
                  className="text-center text-lg tracking-widest"
                />
              </div>
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
              {success && (
                <p className="text-sm text-green-600">{success}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading || otp.length < 6}>
                {loading ? '驗證中...' : '確認登入'}
              </Button>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  className="text-sm text-slate-500 hover:text-slate-700 underline"
                  onClick={() => {
                    setStep('email');
                    setOtp('');
                    setError('');
                    setSuccess('');
                  }}
                >
                  更改電郵
                </button>
                <button
                  type="button"
                  className="text-sm text-slate-500 hover:text-slate-700 underline"
                  onClick={handleResend}
                  disabled={loading}
                >
                  重新發送驗證碼
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>


    </div>
  );
};

export default Login;
