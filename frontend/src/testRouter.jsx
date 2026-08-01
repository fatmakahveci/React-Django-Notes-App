import { useMemo } from "react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

export default function TestRouter({ path = "/", children }) {
	const memory = useMemo(() => memoryLocation({ path }), [path]);
	return <Router hook={memory.hook}>{children}</Router>;
}
