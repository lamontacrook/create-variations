/*
 * <license header>
 */

import React, { useState, useEffect } from "react";
import { attach } from "@adobe/uix-guest";
import {
  Flex,
  Provider,
  Content,
  View,
  defaultTheme,
  Text,
  ButtonGroup,
  SearchField,
  ActionButton,
  ListView,
  Item,
  Divider
} from "@adobe/react-spectrum";
import actionWebInvoke from '../utils';
import allActions from '../config.json';
import { extensionId } from "./Constants";
import { useParams } from "react-router-dom";

export default function () {
  const updateSearchedAudience = (item) => {
    if (item)
      return setSearchedAudience([...searchedAudience, currentKey]);
    else
      return [];
  };
  const updateSelectedAudiences = (item) => {
    if (item) {
      const {currentKey} = item;
      console.log(currentKey);
      return setSelectedAudiences([...selectedAudiences, currentKey]);
    } else
      return [];
  };
  const [guestConnection, setGuestConnection] = useState();
  const [actionInvokeInProgress, setActionInvokeInProgress] = useState(false);
  const [actionResponse, setActionResponse] = useState();
  const [searchValue, setSearchValue] = useState('')
  const [audiences, setAudiences] = useState([]);
  const [selectedAudiences, setSelectedAudiences] = useState(updateSelectedAudiences);
  const [searchedAudience, setSearchedAudience] = useState(updateSearchedAudience);

  let { fragment } = useParams();

  useEffect(() => {
    (async () => {
      const guestConnection = await attach({ id: extensionId });
      const { model, path } = await guestConnection.host.contentFragment.getContentFragment();
      const config = '/content/dam/extension-configurations/extension-config';
      setGuestConnection(guestConnection);
      fetchAudiences(guestConnection, config);
    })();
  }, []);

  const onCloseHandler = () => {
    guestConnection.host.modal.close();
  };
  console.log(selectedAudiences);
  return (
    <Provider theme={defaultTheme} colorScheme='light'>
      <View width="100%">
        <Flex direction='column' width='100%' gap={"size-100"}>
          <SearchField
            value={searchValue}
            onChange={setSearchValue}
            label="Audience Search"
            onSubmit={updateSearchedAudience} />
          <Divider orientation="horizontal" size='S' />
          <ListView
            selectionStyle='checkbox'
            width="100%"
            aria-label="ListView with controlled selection"
            selectionMode="multiple"
            items={audiences}
            selectedKeys={selectedAudiences}
            onSelectionChange={updateSelectedAudiences}
          >
            {(item) => (
              <Item key={item.name}>
                {item.name}
              </Item>
            )}
          </ListView>
        </Flex>
        <Flex width="100%" justifyContent="space-between" direction="row" marginTop="size-400">
          <ButtonGroup>
            <ActionButton variant="primary" onPress={createVariations}>Create Variations</ActionButton>
          </ButtonGroup>
          <Text maxHeight={"size-100"}>Version 1.3</Text>
        </Flex>
      </View >
    </Provider >
  );


  async function createVariations() {
    const headers = {
      'Authorization': 'Bearer ' + guestConnection.sharedContext.get('auth').imsToken,
      'x-gw-ims-org-id': guestConnection.sharedContext.get('auth').imsOrg
    };

    const { model, path } = await guestConnection.host.contentFragment.getContentFragment();

    const params = {
      aemHost: `https://${guestConnection.sharedContext.get('aemHost')}`,
      selectedAudiences: selectedAudiences,
      modelPath: model.path,
      fragmentPath: path.replace('/content/dam', '/api/assets')
    };

    const action = 'create-variations';

    try {
      const actionResponse = await actionWebInvoke(allActions[action], headers, params);
      setActionResponse(actionResponse);
      console.log(`Response from ${action}:`, actionResponse);
      onCloseHandler();
    } catch (e) {
      console.error(e)
    }
  }

  async function fetchAudiences(conn, config) {
    setActionInvokeInProgress(true);
    const headers = {
      'Authorization': 'Bearer ' + conn.sharedContext.get('auth').imsToken,
      'x-gw-ims-org-id': conn.sharedContext.get('auth').imsOrg
    };

    const params = {
      aemHost: `https://${conn.sharedContext.get('aemHost')}`,
      query: 'variation-extension', 
      config: config
      };

    const action = 'fetch-audiences';

    try {
      const actionResponse = await actionWebInvoke(allActions[action], headers, params);
      setActionResponse(actionResponse);

      if (actionResponse.hasOwnProperty('data')) {
        let n = 0;
        const items = actionResponse.data.audienceConfigurationList.items[0].audiences.map((item) => {
          return { id: n++, name: item }
        });

        setAudiences(items);
      } else {
        const items = actionResponse.audiences.filter((item) => {
          if (item.name)
            return { id: item.id, name: item.name }
        });
        setAudiences(items);
      }

      console.log(`Response from ${action}:`, actionResponse)
    } catch (e) {
      console.error(e)
    }
    conn.host.modal.set({ loading: false });
    setActionInvokeInProgress(false);
  }
}
