/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SpeedInsights } from '@vercel/speed-insights/react';
import Dashboard from "./components/Dashboard";

export default function App() {
  return (
    <>
      <Dashboard />
      <SpeedInsights />
    </>
  );
}
