import { PlaylistBasicVM, PlayableSongVM, SongBasicVM } from './api-view-models';

//Internal models not meant for communication with the API

//Holds information about the context in which options for a song (or multiple songs)
//should be displayed (as a part of a playlist? isolated? multiple songs?)
export class SongOptionsContext {
    songs: SongBasicVM[];
    playlist: PlaylistBasicVM = null; //Optional - required for removeFromPlaylist and ChangePosition
    songPositionInPlaylist: number = null; //Optional - required for changePosition
    maxPositionInPlaylist: number = null; //Optional - required for changePosition
}

//Represents a state of Youtube player, namely whether shuffle and repeat are on or off,
//is it playing or paused and which sond is currently loaded
export class YtPlayerState {
    public repeatOn: boolean;
    public shuffleOn: boolean;
    public isPlaying: boolean;
    public loadedSongId: string;
}

//Helper class to be used in components whenever the component has multiple states
//(and a different view for each state) among which it switches.
export class StateSwitch {

    possibleStates: string[];
    currentState: string;

    constructor(possibleStates: string[], initialState : string) {
        this.possibleStates = possibleStates;
        this.changeState(initialState);
    }

    changeState(targetState: string) {
        //change only if target state is a possible state
        if (this.possibleStates.indexOf(targetState) != -1) 
            this.currentState = targetState;
        else
            console.log(`[StateSwitch Model]: state doesn't exist: ${targetState} + " not in "  ${this.possibleStates}`);
    }
}


