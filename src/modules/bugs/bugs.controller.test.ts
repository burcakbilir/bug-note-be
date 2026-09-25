import { describe, expect, it } from "vitest";
import { isSafeHttpUrl } from "./bugs.controller";

describe("isSafeHttpUrl", () => {
    it("accepts a real http(s) link", ()=> {
        expect(isSafeHttpUrl("https://github.com")).toBe(true)
    });

    it("rejects the javascript: schema", ()=> {
        expect(isSafeHttpUrl("javascript:alert(1)")).toBe(false)
    });

    it("rejects a meaningless string", ()=> {
        expect(isSafeHttpUrl("not-a-url")).toBe(false)
    })
})