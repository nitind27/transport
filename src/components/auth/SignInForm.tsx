"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from 'react-toastify';

import Spinner from "@/common/Spinner";

type Company = {
  id: number;
  name: string;
  contactnumber: string;
  address: string;
  gstno: string;
  status: string;
};

export default function SignInForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    company_id: ""
  });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [companyError, setCompanyError] = useState("");
  // const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // New loading state

  // Fetch companies on component mount
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoadingCompanies(true);
        const response = await fetch('/api/company');
        if (!response.ok) {
          throw new Error('Failed to fetch companies');
        }
        const result = await response.json();
        setCompanies(result || []);
      } catch (error) {
        console.error('Error fetching companies:', error);
        toast.error('Failed to load companies. Please refresh the page.');
      } finally {
        setLoadingCompanies(false);
      }
    };

    fetchCompanies();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear company error when user selects a company
    if (name === 'company_id' && value) {
      setCompanyError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate company selection
    if (!formData.company_id) {
      setCompanyError("कृपया कंपनी निवडा");
      toast.error('कृपया कंपनी निवडा');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // ✅ Store name and other data in session storage
      if (data.user.name) {
        sessionStorage.setItem('userName', data.user.name);
        sessionStorage.setItem('category_name', data.user.category_name);
        sessionStorage.setItem('category_id', data.user.category_id);
        sessionStorage.setItem('village_id', data.user.village_id);
        sessionStorage.setItem('taluka_id', data.user.taluka_id);
        sessionStorage.setItem('userid', data.user.user_id);
        // Store company_id from selected company
        sessionStorage.setItem('company_id', formData.company_id);
      }
      if (isChecked) {
        localStorage.setItem('rememberedUsername', formData.username);
        localStorage.setItem('rememberedpassword', formData.password);
      } else {
        localStorage.removeItem('rememberedUsername');
        localStorage.removeItem('rememberedpassword');
      }

      toast.success('Login successful!');
      router.push('/');
       
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Invalid credentials';
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const rememberedUsername = localStorage.getItem('rememberedUsername');
    const rememberedpassword = localStorage.getItem('rememberedpassword');
    if (rememberedUsername && rememberedpassword) {
      setFormData(prev => ({ ...prev, username: rememberedUsername, password: rememberedpassword }));
      setIsChecked(true);
    }
  }, []);


  return (
    <>

      <div className="flex flex-col flex-1 lg:w-1/2 w-full">
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
          <div>
            <div className="mb-5 sm:mb-8">
              <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                Sign In
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enter your username and password to sign in!
              </p>
            </div>


            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Company Select Box */}
                <div>
                  <Label>
                    Company <span className="text-error-500">*</span>
                  </Label>
                  <select
                    name="company_id"
                    className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${
                      companyError ? "border-red-500" : ""
                    }`}
                    value={formData.company_id}
                    onChange={handleChange}
                    required
                    disabled={loadingCompanies}
                  >
                    <option value="">
                      {loadingCompanies ? "Loading companies..." : "Select Company"}
                    </option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                  {companyError && (
                    <div className="text-red-500 text-sm mt-1 pl-1">
                      {companyError}
                    </div>
                  )}
                </div>

                <div>
                  <Label>
                    Username <span className="text-error-500">*</span>
                  </Label>
                  <input
                    name="username"
                    className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden  dark:placeholder:text-white/30  bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <Label>
                    Password <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <input
                      name="password"
                      className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden  dark:placeholder:text-white/30  bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isChecked} onChange={setIsChecked} />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      Keep me logged in
                    </span>
                  </div>
                  <Link
                    href="/reset-password"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div>
                  <Button
                    className="w-full"
                    size="sm"
                    disabled={isLoading || loadingCompanies}
                  >
                    {isLoading ? <Spinner /> : 'Sign in'}
                  </Button>
                </div>
                <div className="text-center">
                  <Link
                    href="/signin"
                    target="_blank"
                    className="text-sm underline text-brand-500 hover:text-brand-600 dark:text-brand-400 cursor-pointer "
                  >
                    Privacy Policy
                  </Link>
                </div>
              </div>
            </form>

          </div>
        </div>
      </div>
    </>
  );
}
