"use client";

import { Suspense } from "react";
import AuthErrorContent from "./AuthErrorContent";

export default function AuthError() {
  return (
    <Suspense fallback={<div>Loading error page...</div>}>
      <AuthErrorContent />
    </Suspense>
  );
}
