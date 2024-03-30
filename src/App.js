import './App.css';
import React, {useCallback, useEffect, useState} from "react";
import {useTelegram} from "./hooks/useTelegram";
import selectorData from "./selectorData";
import {CloseButton, NativeSelect, Select, Textarea, TextInput} from "@mantine/core";


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
  const [providerValue, setProviderValue] = useState('');
  const [regionValue, setRegionValue] = useState('');
  const [commentValue, setCommentValue] = useState('');

  const [url, setUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(true);

  const onSendData = useCallback(() => {
    if (!url) {
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
      commentValue
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    // Do something with form data
    console.log({
      providerValue,
      regionValue,
      commentValue
    });
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
              rightSection={
                <CloseButton
                    aria-label="Clear input"
                    onClick={() => {
                      setUrl('')
                      setIsValidUrl(true)
                    }}
                    style={{ display: url ? undefined : 'none' }}
                />
              }
          />
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

export default App;
