import './App.module.css';
import React, {useCallback, useEffect, useState} from "react";
import {useTelegram} from "./hooks/useTelegram";
import selectorData from "./selectorData";
import {
  Checkbox,
  CloseButton,
  Flex,
  Image,
  NativeSelect,
  Select, SimpleGrid,
  Text,
  Textarea,
  TextInput,
  UnstyledButton
} from "@mantine/core";
import classes from './App.module.css'
import {useUncontrolled} from "@mantine/hooks";


const buf2hex = (buffer) => {
  return [...new Uint8Array(buffer)]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('');
}

const hashTelegramId = async (id) => {
  let buffer = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(id));
  return buf2hex(buffer)
}


function App() {
  const {onToggleButton, tg} = useTelegram();

  useEffect(() => {
    tg.MainButton.text = "Отправить отчет"
    tg.MainButton.show();
    tg.ready();
  }, [])

  const [hashedTgId, setHashedTgId] = useState('');

  useEffect(() => {
    const setHashedId = async () => {
      let tgId = tg.initDataUnsafe?.user?.id;
      if (tgId) {
        let hashed = await hashTelegramId(tgId);
        setHashedTgId(hashed);
      }
    };

    setHashedId();
  }, []);

  const onClose = () => {
    tg.close();
  }

  const PROVIDERS = selectorData.providers.map(p => p.name)
  const REGIONS = selectorData.regions.map(p => p.name)
  const VPN_USE_CASES = selectorData.vpn_use_cases.map(p => p.name)
  const VPN_PROVIDERS = selectorData.vpn_providers.map(p => p.name)
  const VPN_PROTOCOLS = selectorData.vpn_protocols.map(p => p.name)
  const [providerValue, setProviderValue] = useState('');
  const [regionValue, setRegionValue] = useState('');
  const [vpnProvider, setVpnProvider] = useState('');
  const [vpnProtocol, setVpnProtocol] = useState('');
  const [isVpnUsed, setVpnUsed] = useState('');
  const [commentValue, setCommentValue] = useState('');

  const [url, setUrl] = useState('https://');
  const [isValidUrl, setIsValidUrl] = useState(true);

  const onSendData = useCallback(() => {
    if (!url || url === 'https://') {
      alert("Пожалуйста заполните url");
      return
    }
    if (!isValidUrl) {
      alert("Невозможно отправить отчет: указан неправильный url!");
      return
    }
    const data = {
      providerValue,
      regionValue,
      url,
      commentValue,
      isVpnUsed,
      vpnProvider,
      vpnProtocol
    }
    tg.sendData(JSON.stringify(data));
  }, [
      providerValue,
      regionValue,
      url,
      commentValue,
      isValidUrl
  ])

  useEffect(() => {
    tg.onEvent('mainButtonClicked', onSendData)
    return () => {
      tg.offEvent('mainButtonClicked', onSendData)
    }
  }, [onSendData])

  const handleRegionSelectChange = (value) => {
    setRegionValue(value);
  };

  const handleTextareaChange = (event) => {
    const { value } = event.target;
    if (value.length <= 140) {
      setCommentValue(value);
    }
  };

  const handleUrlChange = (event) => {
    const inputValue = event.target.value;
    setUrl(inputValue);
    setIsValidUrl(isValidURL(inputValue));
  };

  const isValidURL = (inputText) => {
    try {
      let parsedUrl = new URL(inputText);
      return inputText.length < 256 && parsedUrl.hostname.split('.').length > 1;
    } catch (error) {
      return false;
    }
  };

  const serviceItems = servicesData.map((item) => <ImageCheckbox {...item} key={item.title} />);

  return (
      <div className="App">
        <form style={{ padding: '20px' }}>
          <NativeSelect
              size={"xl"}
              label="Интернет-провайдер"
              data={PROVIDERS}
              value={providerValue}
              onChange={(event) => setProviderValue(event.currentTarget.value)}
              placeholder="Выберите ваш интернет-провайдер"
              required
          />
          <Select
              size={"xl"}
              label="Регион"
              data={REGIONS}
              value={regionValue}
              onChange={handleRegionSelectChange}
              placeholder="Введите ваш регион"
              searchable
              clearable
              nothingFoundMessage="Не найден..."
          />
          <TextInput
              className={"url"}
              size={"xl"}
              label="Вставьте ссылку на недоступный ресурс"
              placeholder="Например, https://example.com"
              value={url}
              onChange={handleUrlChange}
              invalid={!isValidUrl}
              error={isValidUrl ? null : 'Введите корректную ссылку'}
              required
              autoCorrect="off"
              autoCapitalize="none"
              rightSection={
                <CloseButton
                    aria-label="Clear input"
                    onClick={() => {
                      setUrl('https://')
                      setIsValidUrl(true)
                    }}
                    style={{ display: url ? undefined : 'none' }}
                />
              }
          />

          <NativeSelect
              size={"xl"}
              label="Работает ли сервис с VPN?"
              data={VPN_USE_CASES}
              value={isVpnUsed}
              onChange={(event) => setVpnUsed(event.currentTarget.value)}
          />
          <NativeSelect
              size={"xl"}
              label="VPN-провайдер"
              data={VPN_PROVIDERS}
              value={vpnProvider}
              onChange={(event) => setVpnProvider(event.currentTarget.value)}
              placeholder="Выберите ваш VPN-провайдер"
          />
          <NativeSelect
              size={"xl"}
              label="VPN-протокол"
              data={VPN_PROTOCOLS}
              value={vpnProtocol}
              onChange={(event) => setVpnProtocol(event.currentTarget.value)}
              placeholder="Выберите ваш VPN-протокол"
          />
          {/*<Flex gap="md"*/}
          {/*      justify="flex-start"*/}
          {/*      align="flex-start"*/}
          {/*      direction="row"*/}
          {/*      wrap="wrap">{serviceItems}</Flex>*/}
          <Textarea
              size={"xl"}
              label={`Комментарий (${commentValue.length}/140)`}
              placeholder="Если вы хотите описать проблему подробнее, то можете оставить тут комментарий"
              value={commentValue}
              onChange={handleTextareaChange}
              minRows={3}
          />
        </form>
      </div>
  );
}

const servicesData = [
  { title: "Мобильный интернет", key: "internet" },
  { title: "Сервисы Google", key: "google" },
  { title: "Youtube", key: "youtube" }
]


function ImageCheckbox({ checked, defaultChecked, onChange, title, description, className, image, ...others }) {
  const [value, handleChange] = useUncontrolled({
    value: checked,
    defaultValue: defaultChecked,
    finalValue: false,
    onChange,
  });

  console.log(classes, "=======");

  return (
      <UnstyledButton
          {...others}
          size={"xl"}
          onClick={() => handleChange(!value)}
          data-checked={value || undefined}
          className={`${classes.buttonwrapper} ${className}`}
      >

        <div className={classes.checkboxbody}>
          <Text fontWeight={500} size={"xl"} lineHeight={1}>
            {title}
          </Text>
        </div>

        <Checkbox
            checked={value}
            onChange={() => {}}
            tabIndex={-1}
            size={"xl"}
            styles={{ input: { cursor: 'pointer' } }}
        />
      </UnstyledButton>
  );
}

export default App;
