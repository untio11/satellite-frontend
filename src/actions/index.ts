import { SignedContent } from '../api/satellite';
import { ADD_PUBLICATION_ACTION_TYPE, TEST_TYPE } from '../constants/action-types';

export interface TestPayload {
   content: string;
}

export function testAction(payload: TestPayload) {
   return { type: TEST_TYPE, payload };
}

export function addPublications(payload: Record<string, SignedContent>) {
   return { type: ADD_PUBLICATION_ACTION_TYPE, payload };
}

export type TestActionType = ReturnType<typeof testAction>;
export type AddPublicationType = ReturnType<typeof addPublications>;

export type ActionUnion = TestActionType | AddPublicationType;
