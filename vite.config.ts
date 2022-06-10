import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const fileRegex = /\.htx$/;

import { parseFragment } from "parse5";
import prettier from "prettier";

const generateTS = (root: any) => {
  let children = "";
  if (root.childNodes) {
    for (const childNode of root.childNodes) {
      if (!childNode.childNodes) {
        const child = childNode.value.trim();
        if (child) {
          children += `"${child}", `;
        }
      } else {
        children += generateTS(childNode) + ",";
      }
    }
  }

  if (root.tagName === "img") {
    children = "";
  }

  return `React.createElement("${root.tagName}", ${JSON.stringify(
    Object.fromEntries(
      root.attrs?.map((attribute) => [attribute.name, attribute.value]) || []
    ),
    null,
    4
  )}, ${children})`;
};

const compileToTS = async (source: string) => {
  const object = parseFragment(source);

  return prettier.format(`
    import React from "react";

    export const useInflate = () => {
      return ${generateTS(object.childNodes[0])};
    };
  `);
};

function loadHyperJS() {
  return {
    name: "load-hyper-js",
    transform: async (source, id) => {
      if (fileRegex.test(id)) {
        const result = await compileToTS(source);
        console.log(result);
        return {
          code: result,
          map: null,
          path: `${id}.ts`,
        };
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [loadHyperJS(), react()],
});
