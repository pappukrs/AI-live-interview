"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/use-auth";

const Index = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    router.push(isAuthenticated ? "/dashboard" : "/login");
  }, [isAuthenticated, router]);

  return null;
};

export default Index;
