import {
  DailyEventObject,
  DailyEventObjectParticipant,
  DailyEventObjectParticipantLeft,
} from '@daily-co/daily-js';
import { useCallback } from 'react';
import { useRecoilValue } from 'recoil';

import { participantState } from '../DailyParticipants';
import { useThrottledDailyEvent } from './useThrottledDailyEvent';

interface UseParticipantArgs {
  onParticipantLeft?(ev: DailyEventObjectParticipantLeft): void;
  onParticipantUpdated?(ev: DailyEventObjectParticipant): void;
}

/**
 * Returns the participant identified by the given sessionId.
 * @param sessionId – The participant's session_id or "local".
 */
export const useParticipant = (
  sessionId: string,
  { onParticipantLeft, onParticipantUpdated }: UseParticipantArgs = {}
) => {
  const participant = useRecoilValue(participantState(sessionId));

  useThrottledDailyEvent(
    ['participant-updated', 'participant-left'],
    useCallback(
      (
        evts: DailyEventObject<'participant-updated' | 'participant-left'>[]
      ) => {
        const filteredEvts = evts.filter(
          (ev) => ev.participant.session_id === sessionId
        );
        if (!filteredEvts.length) return;
        filteredEvts.forEach((ev) => {
          switch (ev.action) {
            case 'participant-updated':
              setTimeout(() => onParticipantUpdated?.(ev), 0);
              break;
            case 'participant-left':
              setTimeout(() => onParticipantLeft?.(ev), 0);
              break;
          }
        });
      },
      [onParticipantLeft, onParticipantUpdated, sessionId]
    )
  );

  return participant;
};