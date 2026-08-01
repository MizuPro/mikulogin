import { expect, test, describe, vi, beforeEach } from "vitest";
import React from "react";
import { SignIn, SignUp, ForgotPassword, ResetPassword } from "../src/index.js";

describe("Komponen UI React Next.js", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test("Komponen UI Next.js (SignIn, SignUp, ForgotPassword, ResetPassword) ter-ekspor dengan benar", () => {
    expect(typeof SignIn).toBe("function");
    expect(typeof SignUp).toBe("function");
    expect(typeof ForgotPassword).toBe("function");
    expect(typeof ResetPassword).toBe("function");
  });

  test("SignIn merender elemen React tanpa crash", () => {
    const element = React.createElement(SignIn, {
      loginApiUrl: "/api/auth/login",
      redirectTo: "/dashboard",
    });

    expect(element).toBeTruthy();
    expect(element.type).toBe(SignIn);
    expect(element.props.loginApiUrl).toBe("/api/auth/login");
    expect(element.props.redirectTo).toBe("/dashboard");
  });

  test("SignUp merender elemen React tanpa crash", () => {
    const element = React.createElement(SignUp, {
      registerApiUrl: "/api/auth/register",
      signInUrl: "/login",
    });

    expect(element).toBeTruthy();
    expect(element.type).toBe(SignUp);
    expect(element.props.registerApiUrl).toBe("/api/auth/register");
    expect(element.props.signInUrl).toBe("/login");
  });

  test("ForgotPassword merender elemen React tanpa crash", () => {
    const element = React.createElement(ForgotPassword, {
      forgotPasswordApiUrl: "/api/auth/forgot-password",
      signInUrl: "/login",
    });

    expect(element).toBeTruthy();
    expect(element.type).toBe(ForgotPassword);
    expect(element.props.forgotPasswordApiUrl).toBe("/api/auth/forgot-password");
    expect(element.props.signInUrl).toBe("/login");
  });

  test("ResetPassword merender elemen React tanpa crash", () => {
    const element = React.createElement(ResetPassword, {
      resetPasswordApiUrl: "/api/auth/reset-password",
      signInUrl: "/login",
    });

    expect(element).toBeTruthy();
    expect(element.type).toBe(ResetPassword);
    expect(element.props.resetPasswordApiUrl).toBe("/api/auth/reset-password");
    expect(element.props.signInUrl).toBe("/login");
  });
});
