import {
  DailyEventObjectInputSettingsUpdated,
  DailyEventObjectNonFatalError,
  DailyInputSettings,
} from '@daily-co/daily-js';
import { useCallback, useEffect } from 'react';
import { atom, useRecoilCallback, useRecoilValue } from 'recoil';

import { useDaily } from './useDaily';
import { useDailyEvent } from './useDailyEvent';

interface UseInputSettingsArgs {
  onError?(ev: DailyEventObjectNonFatalError): void;
  onInputSettingsUpdated?(ev: DailyEventObjectInputSettingsUpdated): void;
}

const inputSettingsState = atom<DailyInputSettings | null>({
  key: 'input-settings',
  default: null,
});
const errorState = atom<string | null>({
  key: 'input-settings-error',
  default: null,
});

export const useInputSettings = ({
  onError,
  onInputSettingsUpdated,
}: UseInputSettingsArgs = {}) => {
  const inputSettings = useRecoilValue(inputSettingsState);
  const errorMsg = useRecoilValue(errorState);
  const daily = useDaily();

  const updateInputSettingsState = useRecoilCallback(
    ({ set }) =>
      (inputSettings: DailyInputSettings) => {
        set(inputSettingsState, inputSettings);
      },
    []
  );

  useEffect(() => {
    if (!daily) return;
    daily.getInputSettings().then(updateInputSettingsState);
  }, [daily, updateInputSettingsState]);

  /**
   * Handle 'input-settings-updated' events.
   */
  useDailyEvent(
    'input-settings-updated',
    useCallback(
      (ev: DailyEventObjectInputSettingsUpdated) => {
        updateInputSettingsState(ev.inputSettings);
        onInputSettingsUpdated?.(ev);
      },
      [onInputSettingsUpdated, updateInputSettingsState]
    )
  );

  /**
   * Handle nonfatal errors of type 'input-settings-error'.
   */
  useDailyEvent(
    'nonfatal-error',
    useRecoilCallback(
      ({ set }) =>
        (ev: DailyEventObjectNonFatalError) => {
          if (ev.type !== 'input-settings-error') return;
          set(errorState, ev.errorMsg);
          onError?.(ev);
        },
      [onError]
    )
  );

  /**
   * Calls daily.updateInputSettings internally.
   */
  const updateInputSettings = useCallback(
    (inputSettings: DailyInputSettings) => {
      daily?.updateInputSettings(inputSettings);
    },
    [daily]
  );

  return {
    errorMsg,
    inputSettings,
    updateInputSettings,
  };
};
