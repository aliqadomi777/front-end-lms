import React from "react";
import Panel from "../../components/Panel";

const Settings = () => (
  <div className="max-w-2xl mx-auto mt-12">
    <Panel className="bg-white rounded-xl shadow-sm p-8 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">Admin Settings</h1>
      <p className="text-gray-600 text-lg text-center">
        Settings management is coming soon.
        <br />
        Here you will be able to configure site-wide options, roles, and feature
        toggles.
      </p>
    </Panel>
  </div>
);

export default Settings;
