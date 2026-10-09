// Wires the order rules to the real database and the real mail server.
import { sendMail } from './_mail.js';
import { createStore, storeConfigured } from './_store.js';

export const isConfigured = storeConfigured;
export const makeContext = () => ({ store: createStore(), mailer: sendMail, now: () => new Date() });
