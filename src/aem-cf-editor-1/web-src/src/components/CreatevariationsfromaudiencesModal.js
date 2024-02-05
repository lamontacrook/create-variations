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
  Button,
  ActionButton,
  ListView,
  Item,
  Section
} from "@adobe/react-spectrum";
import actionWebInvoke from '../utils';
import allActions from '../config.json';
import { extensionId } from "./Constants";
import Spinner from './Spinner';
import { useParams } from "react-router-dom";

export default function () {
  const [guestConnection, setGuestConnection] = useState();
  const [actionInvokeInProgress, setActionInvokeInProgress] = useState(false);
  const [actionResponse, setActionResponse] = useState();
  // const [model, setModel] = useState();
  // const [cfPath, setCFPath] = useState();
  // const [config, setConfig] = useState();
  const [audiences, setAudiences] = useState([]);
  const [selectedAudiences, setSelectedAudiences] = useState([]);
  const [activities, setActivities] = useState([]);

  let { fragment } = useParams();

  useEffect(() => {
    (async () => {
      const guestConnection = await attach({ id: extensionId });
      // const api = await guestConnection.host.dataApi.get();
      // api.setValue('variations', 'test');

      const { model, path } = await guestConnection.host.contentFragment.getContentFragment();
      const config = `${path.split('/').slice(0, 4).join('/')}/site/configuration/configuration`;
      setGuestConnection(guestConnection);
      fetchAudiences(guestConnection, config);
    })();
  }, []);

  const onCloseHandler = () => {
    guestConnection.host.modal.close();
  };

  return (
    <Provider theme={defaultTheme} colorScheme='light'>
      <View width="100%">
        <Flex direction='row' width='100%' gap='size-100'>
          {/* <Flex direction='column' width='100%'>
            <Text>Activities</Text>
            <ListView
              width="100%"
              aria-label="ListView with controlled selection"
              selectionMode="single"
              items={activities}
              selectionStyle="highlight"
              onSelectionChange={(selection) => fetchAudiences(selection)}
            >

              {(item) => (
                <Item key={item.name}>
                  {item.name}
                </Item>
              )}

            </ListView>
          </Flex> */}

          <Flex direction='column' width='100%'>
            <Text>Audiences</Text>
            <ListView
              width="100%"
              aria-label="ListView with controlled selection"
              selectionMode="multiple"
              items={audiences}
              onSelectionChange={(selection) => {
                Object.entries(selection).forEach((item) => {
                  if (!selectedAudiences.includes(item[1])) selectedAudiences.push(item[1]);
                });
              }}
            >

              {(item) => (
                <Item key={item.name}>
                  {item.name}
                </Item>
              )}

            </ListView>
          </Flex>
        </Flex>
        <Flex width="100%" justifyContent="end" alignItems="center" marginTop="size-400">
          <ButtonGroup align="end">
            <ActionButton variant="primary" onPress={createVariations}>Create Variations</ActionButton>
          </ButtonGroup>
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
    console.log(selectedAudiences);
    console.log(`${params.aemHost}${params.fragmentPath}`);

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
      config: config
    };

    const action = 'fetch-audiences';

    try {
      const actionResponse = await actionWebInvoke(allActions[action], headers, params);
      setActionResponse(actionResponse);

      if (actionResponse.hasOwnProperty('data')) {
        let n = 0;
        const items = actionResponse.data.configurationByPath.item.audiences.map((item) => {
          return { id: n++, name: item }
        });

        setAudiences(items);
      } else {
        const items = actionResponse.audiences.filter((item) => {
          if(item.name)
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

  async function fetchActivities(conn, config) {
    setActionInvokeInProgress(true);
    const headers = {
      'Authorization': 'Bearer ' + conn.sharedContext.get('auth').imsToken,
      'x-gw-ims-org-id': conn.sharedContext.get('auth').imsOrg
    };

    const params = {
      aemHost: `https://${conn.sharedContext.get('aemHost')}`,
      config: config
    };

    const action = 'fetch-activities';

    try {
      const actionResponse = await actionWebInvoke(allActions[action], headers, params);
      setActionResponse(actionResponse);

      if (actionResponse.hasOwnProperty('data')) {
        let n = 0;
        const items = Object.keys(actionResponse.data.configurationByPath.item.audienceMapping).map((item) => {
          return { id: n++, name: item }
        });

        setActivities(items);
      } else {
        const items = Object.entries(actionResponse.activities).map(([key, val]) => {
          return { id: key, name: val.name }
        });
        setActivities(items);
      }

      console.log(`Response from ${action}:`, actionResponse)
    } catch (e) {
      console.error(e)
    }
    conn.host.modal.set({ loading: false });
    setActionInvokeInProgress(false);
  }
}
