// ==============================================================================
// Copyright (C) 2019 - Philip Paquette, Steven Bocco
//
//  This program is free software: you can redistribute it and/or modify it under
//  the terms of the GNU Affero General Public License as published by the Free
//  Software Foundation, either version 3 of the License, or (at your option) any
//  later version.
//
//  This program is distributed in the hope that it will be useful, but WITHOUT
//  ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
//  FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more
//  details.
//
//  You should have received a copy of the GNU Affero General Public License along
//  with this program.  If not, see <https://www.gnu.org/licenses/>.
// ==============================================================================
import React from 'react';
import {ORDER_BUILDER} from "../utils/order_building";
import PropTypes from "prop-types";
import {Button} from "../components/button";
// import ToneToggle from '../components/ToneToggle';

import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';
import {cloneDeep, get, isEqual} from 'lodash';


export class MessageForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = this.initState();
        this.onValueChange = this.onValueChange.bind(this);
        this.checkboxOnChange = this.checkboxOnChange.bind(this);
        this.onFinalSubmit = this.onFinalSubmit.bind(this);
        this.onGlossSubmit = this.onGlossSubmit.bind(this);
        this.onToneChange = this.onToneChange.bind(this);
        this.onResponseChange = this.onResponseChange.bind(this);
        this.onSelectChange = this.onSelectChange.bind(this);
        this.onSupportChange = this.onSupportChange.bind(this);
        this.displayFormContents = this.displayFormContents.bind(this);
        this.generateCheckboxes = this.generateCheckboxes.bind(this);
        this.renderEndLocation = this.renderEndLocation.bind(this);
        this.generateSupportMoves = this.generateSupportMoves.bind(this);
        this.generateConvoyMoves = this.generateConvoyMoves.bind(this);
    }



static locations = ["ADR", "AEG", "ALB", "ANK", "APU", "ARM", "BAL", "BAR", "BEL", "BER", "BLA", "BOH", "BOT", "BRE", "BUD", "BUL", "BUR", "CLY", "CON", "DEN", "EAS", "EDI", "ENG", "FIN", "GAL", "GAS", "GRE", "HEL", "HOL", "ION", "IRI", "KIE", "LON", "LVN", "LVP", "LYO", "MAO", "MAR", "MOS", "MUN", "NAF", "NAO", "NAP", "NTH", "NWG", "NWY", "PAR", "PIC", "PIE", "POR", "PRU", "ROM", "RUH", "RUM", "SER", "SEV", "SIL", "SKA", "SMY", "SPA", "STP", "SWE", "SYR", "TRI", "TUN", "TUS", "TYR", "TYS", "UKR", "VEN", "VIE", "WAL", "WAR", "WES", "YOR"];

static countries = [
    {
        id: "austria",
        name: "Austria"
    },
    {
        id: "england",
        name: "England"
    },
    {
        id: "france",
        name: "France"
    },
    {
        id: "germany",
        name: "Germany"
    },
    {
        id: "italy",
        name: "Italy"
    },
    {
        id:"russia",
        name: "Russia"
    },
    {
        id:"turkey",
        name: "Turkey"
    },
];
    initState() {
        return {
            submitted: false,
            selectedAction: 'propose_order',
            selectedOrder: 'M',
            startLocation: '',
            midLocation: '',
            endLocation: '',
            dmzLocation: 'ADR',
            selectedCountries: {},
            targets: {},
            actors: {},
            selectedTones: {},
            response: '',
            orderTarget: 'player',
            gloss: true,
            disableSubmit: true,
        };
    }

    onValueChange(event) {
        this.setState(prevState => ({ ...prevState, selectedAction: event.target.value }));
    }

    onResponseChange(event) {
        event.persist();
        this.setState(prevState => ({
            selectedAction: prevState.selectedAction,
            selectedOrder: prevState.selectedOrder,
            selectedCountries: prevState.selectedCountries,
            selectedTones: prevState.selectedTones,
            targets: prevState.targets,
            response: event.target.value,
        }));
    }

    onSelectChange(event) {
        event.persist();
        const id = event.target.id;
        const value = event.target.value;
        let locationReturn = {};
        locationReturn[id] = value;
        setTimeout( () => this.setState( locationReturn ));
    }

    onSupportChange(event) {
        event.persist();
        const value = event.target.value;
        const locations = value.split(" ");
        let supportReturn = {};
        supportReturn['startLocation'] = locations[0];
        supportReturn['midLocation'] = locations[1];
        supportReturn['endLocation'] = locations[2];
        console.log(supportReturn);
        setTimeout( () => this.setState( supportReturn ));
    }

    checkboxOnChange(event, checkboxType, name) {
        this.setState((prevState) => {
            // deep clone the state object so react picks up our changes
            const clonedState = cloneDeep(prevState);
            if (!event.target.checked) {
                // remove any previous country keys from the state object if it's an uncheck
                // but do it to this prevState here, so we aren't modifying state directly
                delete clonedState[checkboxType][name];
            } else if (event.target.checked) {
                // or add a check to the appropriate state field (targets or selectedCountries)
                clonedState[checkboxType][name] = true;
            }

            return clonedState;
        });
    }

    onToneChange(newTone) {
        this.setState((prevState) => ({...prevState, selectedTones: { [newTone]: true, updatedTone: true }}));
    }

    onGlossSubmit(event) {
        event.preventDefault();
        let actorHolder = [];
        for (let country in this.state.selectedCountries){
            if (!(country === "updatedCountry")){
                if(this.state.selectedCountries[country]){
                    actorHolder.push(country);
                }
            }
        }
        let targetHolder = [];
        if(this.state.selectedAction === "propose_alliance" 
            || this.state.selectedAction === "oppose_alliance"
            || this.state.selectedAction === "notify_alliance"){
            for (let country in this.state.targets){
                if (!(country === "updatedTarget")){
                    if(this.state.targets[country]){
                        targetHolder.push(country);
                    }
                }
            }
        }
        let toneHolder = [];
        for (let tone in this.state.selectedTones){
            if (!(tone === "updatedTones")){
                if(this.state.selectedTones[tone]){
                    toneHolder.push(tone);
                }
            }
        }
        this.setState({ gloss: true });
        const message = {
            action: this.state.selectedAction,
            order: this.state.selectedOrder,
            orderTarget: this.state.orderTarget,
            startLocation: this.state.startLocation,
            midLocation: this.state.midLocation,
            endLocation: this.state.endLocation,
            dmzLocation: this.state.dmzLocation,
            actors: actorHolder,
            targets: targetHolder,
            tones: toneHolder,
            response: this.state.response,
            gloss: true,
        };

        if (this.props.onSubmit){
            this.props.onSubmit({negotiation: JSON.stringify(message),
                                message: '',
                                daide: '',
                                gloss: true});
        }

        // enable the submit button
        this.setState({ disableSubmit: false });
        setTimeout( () => {console.log(`State:`, this.state)});
    }

    onFinalSubmit(event) {
        event.preventDefault();
        let actorHolder = [];
        for (let country in this.state.selectedCountries){
            if (!(country === "updatedCountry")){
                if(this.state.selectedCountries[country]){
                    actorHolder.push(country);
                }
            }
        }
        let targetHolder = [];
        if(this.state.selectedAction === "propose_alliance" 
        || this.state.selectedAction === "oppose_alliance"
        || this.state.selectedAction === "notify_alliance"){
            for (let country in this.state.targets){
                if (!(country === "updatedTarget")){
                    if(this.state.targets[country]){
                        targetHolder.push(country);
                    }
                }
            }
        }
        let toneHolder = [];
        for (let tone in this.state.selectedTones){
            if (!(tone === "updatedTones")){
                if(this.state.selectedTones[tone]){
                    toneHolder.push(tone);
                }
            }
        }
        const message = {
            action: this.state.selectedAction,
            order: this.state.selectedOrder,
            orderTarget: this.state.orderTarget,
            startLocation: this.state.startLocation,
            midLocation: this.state.midLocation,
            endLocation: this.state.endLocation,
            dmzLocation: this.state.dmzLocation,
            actors: actorHolder,
            targets: targetHolder,
            tones: toneHolder,
            response: this.state.response,
            gloss: false,
        };

        if (this.props.onSubmit){
            this.props.onSubmit({
                negotiation: JSON.stringify(message),
                message: '',
                daide: '',
                gloss: false
            });
        }
        // trigger the ToneToggle to reset
        this.setState({ submitted: true });

        // cause this setstate to happen after the above so that the updates don't get batched
        setTimeout(() => this.setState(this.initState()));
    }

    generateCheckboxes(checkboxType) {
        return (
            <>
                {MessageForm.countries.map(({ id, name }) => (
                    <FormControlLabel key={id}
                        control={
                            <Checkbox
                                checked={this.state[checkboxType][id]}
                                onChange={(event) => this.checkboxOnChange(event, checkboxType, name)}
                            />
                        } label={name}
                        sx={{ margin: 0, display: 'block' }}
                    />
                ))}
            </>
        );
    }

    renderEndLocation(){
        let renderedEndLocs = [];

        if (this.state.startLocation !== "") {

            const { engine } = this.props;
            const possibleOrders = get(engine, `possibleOrders[${this.state.startLocation}]`, []);

            return (
                possibleOrders.map(order => {
                    let possibleSplit = order.split(' ');
                    let lastElement = possibleSplit[possibleSplit.length - 1];
                    if ( lastElement !== "H" && renderedEndLocs.includes(lastElement) === false) {
                        renderedEndLocs.push(lastElement);
                        return(
                            <option key={`${lastElement}-key`} value={lastElement}>{lastElement}</option>
                        );
                    }
            }));
        } else {
            return (
                MessageForm.locations.map((location) =>{
                    return(
                        <option key={`${location}-key`} value={location}>{location}</option>
                    );
                }
            ));
        }
    }

    generateSupportMoves(){

        const { startLocation } = this.state;
        const { engine } = this.props;

        const possibleOrdersForGivenStart = get(engine, `possibleOrders[${startLocation}]`, []);

        let supportMoves = {};

        if (startLocation !== "") {
            possibleOrdersForGivenStart.map(order => {
                if(order.includes(' S ')){
                    let possibleSplit = order.split(' ');
                    let locKey = possibleSplit[1] + " " + possibleSplit[4] + " " + possibleSplit[6];

                    console.log(possibleSplit);

                    for (let i =0; i < possibleSplit.length; i++) {
                        if(possibleSplit[i] === 'A'){
                            possibleSplit[i] = "Army in";
                        }
                        else if(possibleSplit[i] === 'F'){
                            possibleSplit[i] = "Fleet in";
                        }
                        else if(possibleSplit[i] === "S"){
                            possibleSplit[i] = "supports";
                        }
                        else if(possibleSplit[i] === '-'){
                            possibleSplit[i] = "moving to";
                        }
                    }

                    let supportString = "";
                    possibleSplit.forEach(element => {
                        supportString += element + " ";
                    });

                    if (supportString) {
                        supportMoves[locKey] = supportString.trim();
                    }
                }
            });
            return (Object.entries(supportMoves).map(([key, value]) => {
                    return (
                        <option key={`${key}-key`} value={key}>{value}</option>
                    );
                }));
        }
    }

    generateConvoyMoves(){
        let convoyMoves = {};
        if(this.state.startLocation !== ""){
            this.props.engine.possibleOrders[this.state.startLocation].map(order => {
                if(order.includes(' C ')){
                    let possibleSplit = order.split(' ');
                    let locKey = possibleSplit[1] + " " + possibleSplit[4] + " " + possibleSplit[6];
                    console.log(possibleSplit);
                    for (let i =0; i < possibleSplit.length; i++){
                        if(possibleSplit[i] === 'A'){
                            possibleSplit[i] = "Army in";
                        }
                        else if(possibleSplit[i] === 'F'){
                            possibleSplit[i] = "Fleet in";
                        }
                        else if(possibleSplit[i] === "C"){
                            possibleSplit[i] = "convoys";
                        }
                        else if(possibleSplit[i] === '-'){
                            possibleSplit[i] = "moving to";
                        }
                    }
                    let supportString = "";
                    possibleSplit.forEach(element => {
                        supportString += element + " ";
                    });
                    if (supportString !== ""){
                        convoyMoves[locKey] = supportString.trim();
                    }
                }
            });
            return (Object.entries(convoyMoves).map(([key, value]) => {
                    return(
                        <option key={`${key}-key`} value={key}>{value}</option>
                    );
                }));
        }
    }

    displayFormContents() {

        const { selectedOrder } = this.state;

        const senderMoves = this.props.senderMoves || {};
        const senderMoveSelectedOrder = get(senderMoves, `[${selectedOrder}]`, []);

        switch (this.state.selectedAction) {
            case "propose_order": case "oppose_order": case "notify_order":
                return (
                        <div className={'form-group'}>
                            <select id="orderTarget" value={this.state.orderTarget} onChange={this.onSelectChange}>
                                <option value="player">Order I can do</option>
                                <option value="recipient">Order they can do</option>
                            </select>
                            {this.state.orderTarget === "player" && (
                                <div>
                                    <h6>Order</h6>
                                    <select id="selectedOrder" value={selectedOrder} onChange={this.onSelectChange}>
                                        {Object.keys(senderMoves).map((orderType) => {
                                            return(
                                                <option key={`${orderType}-key`} value={orderType}>{ORDER_BUILDER[orderType].name}</option>
                                            );
                                        })}
                                    </select>
                                    <div>
                                        <h6>Start Location</h6>
                                        <select id="startLocation" value={this.state.startLocation} onChange={this.onSelectChange}>
                                            <option value="">-</option>
                                            {senderMoveSelectedOrder.map((location) => {
                                                return(
                                                    <option key={`${location}-key`} value={location}>{location}</option>
                                                );
                                            })}
                                        </select>
                                        {selectedOrder !== "H" && selectedOrder !== "S" && selectedOrder != "C" && (
                                            <div>
                                                <h6>End Location</h6>
                                                <select id="endLocation" value={this.state.endLocation} onChange={this.onSelectChange}>
                                                    <option value="">-</option>
                                                    {this.renderEndLocation()}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                    {selectedOrder === "S" && (
                                        <div>
                                            <select id="supportSelector" onChange={this.onSupportChange}>
                                                <option value="">-</option>
                                                {this.generateSupportMoves()}
                                            </select>
                                        </div>
                                    )}
                                    {selectedOrder === "C" && (
                                        <div>
                                            <select id="convoySelector" onChange={this.onSupportChange}>
                                                <option value="">-</option>
                                                {this.generateConvoyMoves()}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            )}
                            {this.state.orderTarget === "recipient" && (
                                <div>
                                    <h6>Order</h6>
                                    <select id="selectedOrder" value={this.state.selectedOrder} onChange={this.onSelectChange}>
                                        {Object.keys(this.props.recipientMoves).map((orderType) => {
                                            return(
                                                <option key={`${orderType}-key`} value={orderType}>{ORDER_BUILDER[orderType].name}</option>
                                            );
                                        })}
                                    </select>
                                    <h6>Start Location</h6>
                                    <select id="startLocation" value={this.state.startLocation} onChange={this.onSelectChange}>
                                        <option value="">-</option>
                                        {this.props.recipientMoves[this.state.selectedOrder].map((location) => {
                                            return(
                                                <option key={`${location}-key`} value={location}>{location}</option>
                                            );
                                        })}
                                    </select>
                                    {selectedOrder !== "H" && selectedOrder !== "S" && selectedOrder != "C" && (
                                        <div>
                                            <h6>End Location</h6>
                                            <select id="endLocation" value={this.state.endLocation} onChange={this.onSelectChange}>
                                                <option value="">-</option>
                                                {this.renderEndLocation()}
                                            </select>
                                        </div>
                                    )}
                                    {selectedOrder === "S" && (
                                        <div>
                                            <select id="supportSelector" onChange={this.onSupportChange}>
                                                <option value="">-</option>
                                                {this.generateSupportMoves()}
                                            </select>
                                        </div>
                                    )}
                                    {selectedOrder === "C" && (
                                        <div>
                                            <select id="convoySelector" onChange={this.onSupportChange}>
                                                <option value="">-</option>
                                                {this.generateConvoyMoves()}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                );
            case "propose_peace": case "propose_alliance": case "notify_alliance":
            case "notify_peace": case "oppose_peace": case "oppose_alliance":
                return (
                    <Grid container justifyContent="center" spacing={4}>
                        <Grid item xs={3}>
                            <div className={'form-group'}>
                                <h6>Countries Involved: </h6>
                                {this.generateCheckboxes('selectedCountries')}
                            </div>
                        </Grid>
                        {/* Also make sure to stick in Alliance Targets if we're in one of these three action types*/}
                        {(this.state.selectedAction === "propose_alliance"
                            || this.state.selectedAction === "notify_alliance"
                            || this.state.selectedAction === "oppose_alliance") && (
                                <Grid item xs={3}>
                                    <div className={'form-group'}>
                                        <h6>Alliance Targets: </h6>
                                        {this.generateCheckboxes('targets')}
                                    </div>
                                </Grid>
                        )}
                    </Grid>
                );
            case "propose_dmz": case "oppose_dmz": case "notify_dmz":
                return (
                    <div className={'form-group'}>
                        <select id="dmzLocation" value={this.state.dmzLocation} onChange={this.onSelectChange}>
                            {MessageForm.locations.map((location) =>{
                                return(
                                    <option key={`${location}-key`} value={location}>{location}</option>
                                );
                            })}
                        </select>
                    </div>
                );
            case "response":
                return (
                    <div>
                        <div className={'form-group'}>
                            <select id="response_type" value={this.state.response} onChange={this.onResponseChange}>
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                                <option value="noyb">None of your business</option>
                            </select>
                        </div>
                    </div>
                );
            default:
                console.log('Please select a valid action');
                // return false so we know not to show any header text when we don't have a form to show
                return false;
        }
    }

    componentDidUpdate(prevProps, prevState) {
        // compare the old form state to the new, so we know when the gloss is out of date
        if (!isEqual(prevState, this.state)
            // but don't do this when it's the disableSubmit state that has changed, or we'll
            // get in an infinite loop
            && prevState.disableSubmit === this.state.disableSubmit) {
            if (this.props.glossed) {
                // if we have a glossed messaged, disable the submit button
                // because the form has changed
                this.setState({ disableSubmit: true });
            }
        }
    }

    render() {
        return (
            <form>
                <Grid container alignItems="center" justifyContent="center" direction="column">
                    <Grid item>
                        <Typography variant="h6" gutterBottom>Choose your negiotiation type</Typography>
                        <FormControl sx={{ marginBottom: '16px', minWidth: 300 }}>
                            <InputLabel id="negotiation-type">Negotiation Type</InputLabel>
                            <Select
                                value={this.state.selectedAction}
                                onChange={this.onValueChange}
                                label="Negotiation Type"
                                id="negotiation-type"
                            >
                                <MenuItem value="propose_order">Propose Order</MenuItem>
                                <MenuItem value="propose_alliance">Propose Alliance</MenuItem>
                                <MenuItem value="propose_peace">Propose Peace</MenuItem>
                                <MenuItem value="propose_draw">Propose Draw</MenuItem>
                                <MenuItem value="propose_solo_win">Propose Solo Win</MenuItem>
                                <MenuItem value="propose_dmz">Propose Demilitarized Zone</MenuItem>
                                <MenuItem value="oppose_peace">Oppose Peace</MenuItem>
                                <MenuItem value="oppose_order">Oppose Order</MenuItem>
                                <MenuItem value="oppose_draw">Oppose Draw</MenuItem>
                                <MenuItem value="oppose_dmz">Oppose Demilitarized Zone</MenuItem>
                                <MenuItem value="oppose_alliance">Oppose Alliance</MenuItem>
                                <MenuItem value="notify_peace">Notify about Peace</MenuItem>
                                <MenuItem value="notify_order">Notify about Order</MenuItem>
                                <MenuItem value="notify_dmz">Notify about Demilitarized Zone</MenuItem>
                                <MenuItem value="notify_alliance">Notify about Alliance</MenuItem>
                                <MenuItem value="cancel">Cancel Previous Proposal</MenuItem>
                                <MenuItem value="response">Response</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Box sx={{ height: '350px', width: '100%' }}>
                        {this.displayFormContents() && (
                            <Typography variant="h6" align="center" gutterBottom>
                                Choose your message
                            </Typography>
                        )}
                        <Grid item container justifyContent="center" direction="row">
                            {this.displayFormContents()}
                        </Grid>
                    </Box>

                    <Box sx={{ my: 3 }}>
                        <Typography variant="h6" align="center" gutterBottom>
                            Choose your negiotiation tone
                        </Typography>
                        {/* <ToneToggle onToneChange={this.onToneChange} submitted={this.state.submitted} /> */}
                    </Box>

                    <Grid item container direction="row" spacing={2} justifyContent="center" style={{marginTop: '16px'}}>
                        <Grid item xs={5}>
                            <Button
                                type='submit'
                                title="Generate Gloss"
                                onClick={this.onGlossSubmit}
                                pickEvent
                                large
                            />
                        </Grid>
                        <Grid item xs={5}>
                            <Button
                                type='submit'
                                disabled={this.state.disableSubmit}
                                title="Submit"
                                onClick={this.onFinalSubmit}
                                pickEvent
                                large
                            />
                        </Grid>
                    </Grid>
                </Grid>
            </form>
        );
    }
}

MessageForm.propTypes = {
    sender: PropTypes.string,
    recipient: PropTypes.string,
    powers: PropTypes.object,
    senderMoves: PropTypes.object,
    recipientMoves: PropTypes.object,
    engine: PropTypes.object,
    onChange: PropTypes.func,
    onSubmit: PropTypes.func,
    glossed: PropTypes.bool,
};