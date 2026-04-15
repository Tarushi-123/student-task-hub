import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSession } from "@/lib/store";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const session = getSession();
    navigate(session ? "/dashboard" : "/login");
  }, [navigate]);

  return null;
};

export default Index;
