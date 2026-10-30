import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";

const useBranches = () => {
  const [branches, setBranches] = useState([]); // [{ id, name }]
  const reload = useCallback(() => api.get("/branches").then(setBranches).catch(() => {}), []);
  useEffect(() => {
    reload();
  }, [reload]);
  return { branches, names: branches.map((b) => b.name), reload };
};
export default useBranches;