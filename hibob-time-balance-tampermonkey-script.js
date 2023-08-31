// ==UserScript==
// @name         hi bob - my attendance time balance
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Show hibob time balance on /attendance/my-attendance . If the time balance does not show, press F5. Time balance is calculated based on the worked days (**by chekcing rows with no notes**) and assuming 8h per day
// @author       sito
// @match        https://app.hibob.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=hibob.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const workingHoursPerDay = 8;
    const balanceOKStyle = 'color: #00DD00;';
    const balanceKOStyle = 'color: #DD0000;';
    const firstRunTimeoutMs = 2000;
    const intervalRunMs = 10000;

    const hourStrToMin = (hourStr) => {
        const [hours, minutes] = hourStr.split(':');
        return (+hours) * 60 + (+minutes);
    };

    const padToTwoDigits = (num) => {
        return num.toString().padStart(2, '0');
    }

    const toHoursAndMinutes = (totalMinutes) => {
        const hours = Math.floor(Math.abs(totalMinutes) / 60);
        const minutes = Math.abs(totalMinutes) % 60;

        return `${totalMinutes>0?'+' : '-'}${padToTwoDigits(hours)}:${padToTwoDigits(minutes)}`;
    }

    const balanceStyle = (timeBalance) => {
        if (timeBalance === 0) {
            return undefined;
        }

        return timeBalance > 0 ? balanceOKStyle: balanceKOStyle;
    };

    const checkTimeBalance = () => {
        if (window.location.pathname !== '/attendance/my-attendance') {
            return;
        }

        const currentRowsWithDatesAndNoNotes = [...document.querySelectorAll('.ag-center-cols-clipper [role="row"]')] // all table data rows
           .filter((elem) => elem.querySelector('[col-id="date"]').innerText ) // rows that have a date
           .filter((elem) => elem.querySelector('[col-id="note.description"]').innerText === '' ); // rows that have no notes

        const summaryInsigts = document.querySelector('b-summary-insights');

        const hoursWorkedStr = document.evaluate("//p[contains(., 'Hours worked')]/../h6/span", document, null, XPathResult.STRING_TYPE, null);

        const expectedWorkedHours = currentRowsWithDatesAndNoNotes.length * workingHoursPerDay;
        const workedMinutes = hourStrToMin(hoursWorkedStr.stringValue);

        const timeBalance = workedMinutes - expectedWorkedHours*60;
        const timeBalanceStr = toHoursAndMinutes(timeBalance);
        const timeBalanceStyle = balanceStyle(timeBalance);

        const timeBalanceElem = document.querySelector('.time-balance');
        if(timeBalanceElem) {
            timeBalanceElem.innerText = timeBalanceStr;
            timeBalanceElem.style = timeBalanceStyle;
            return;
        }

        const timeBalanceH6 = document.querySelector('b-label-value:last-child h6').cloneNode();
        timeBalanceH6.className += ' time-balance'
        timeBalanceH6.innerText = timeBalanceStr;
        timeBalanceH6.style = timeBalanceStyle;

        const timeBalanceP = document.querySelector('b-label-value:last-child p').cloneNode();
        timeBalanceP.innerText = 'Time balance so far';

        const timeBalanceBLabelValue = document.querySelector('b-label-value:last-child').cloneNode();
        timeBalanceBLabelValue.appendChild(timeBalanceH6);
        timeBalanceBLabelValue.appendChild(timeBalanceP);
        summaryInsigts.appendChild(timeBalanceBLabelValue);
    };

    setTimeout(checkTimeBalance, firstRunTimeoutMs);
    const checkTimeBalanceInterval = setInterval(checkTimeBalance, intervalRunMs);
})();
