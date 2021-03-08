import { TEST_TYPE } from "../constants/action-types";

export interface TestPayload {
    content: string;
}

export function testAction(payload: TestPayload) {
    return { type: TEST_TYPE, payload };
}

export type TestActionType = ReturnType<typeof testAction>;