/*
 * <license header>
 */

import React from "react";
import {
  Flex,
  ProgressBar,
} from "@adobe/react-spectrum";

export default function Spinner(props) {
  return (
    <Flex alignItems="center" justifyContent="center" height='50%'>
      <ProgressBar label="Fetching Audiences…" isIndeterminate/>
      {props.children}
    </Flex>
  );
}
