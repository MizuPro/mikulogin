import { expect, test, describe, vi, beforeEach } from "vitest";
import React from "react";
import { SignIn, SignUp } from "../src/index";

describe("Komponen UI React Next.js", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test("Komponen UI Next.js (SignIn & SignUp) ter-ekspor dengan benar", () => {
    expect(typeof SignIn).toBe("function");
    expect(typeof SignUp).toBe("function");
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
});
