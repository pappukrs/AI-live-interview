import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/lib/use-auth";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    navigate(isAuthenticated ? "/dashboard" : "/login");
  }, [isAuthenticated, navigate]);

  return null;
};

export default Index;
