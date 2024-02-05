/*
 * <license header>
 */

import React from "react";
import {
  Flex,
  ProgressBar,
  Text
} from "@adobe/react-spectrum";

export default function Spinner(props) {
  return (
    <Flex alignItems="center" justifyContent="center" height="50vh">
      <ProgressBar label="Fetching Audiences…" isIndeterminate/>
      {props.children}
    </Flex>
  );
}
