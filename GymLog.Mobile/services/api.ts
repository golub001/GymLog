import axios from "axios";

export const api = axios.create({
  //baseURL: "http://10.0.2.2:5166/api",
  baseURL: "http://192.168.0.27:5166/api",
  headers: { "Content-Type": "application/json" },
});