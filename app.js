const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'data.json');
const raw = fs.readFileSync(filePath, 'utf-8');
const data = JSON.parse(raw);

validateData(data);
displayReport(data);

// Validation functions

function validateData(data) {

    if (typeof data !== "object" || data === null) fail("Data must be an object");

    if (typeof data.companyName !== "string" || data.companyName === "") fail("Company name must be a non-empty string");

    if (typeof data.reportPeriod !== "string" || data.reportPeriod === "") fail("Report period must be a non-empty string");

    if (typeof data.currency !== "string" || data.currency === "") fail("Currency must be a non-empty string");

    if (!Array.isArray(data.channels) || data.channels.length === 0) fail("Channels must be a non-empty array");

    if (!Array.isArray(data.campaigns) || data.campaigns.length === 0) fail("Campaigns must be a non-empty array");

    validateChannel(data.channels);
    validateCampaign(data.campaigns, data.channels);

}

function validateChannel (channels) {
    
    const channelSet = new Set();

    channels.forEach((channel, index) => {

        if (typeof channel !== "string" || channel === "") fail("Channel at index " + index + " must be a non-empty string");

        if (channelSet.has(channel)) fail("Duplicate channel found: " + channel + " at index: " + index);

        channelSet.add(channel);

    });

}

function validateCampaign (campaignData, channels) {

    const channelSet = new Set(channels);
    const campaignIds = new Set();

    campaignData.forEach((campaign, index) => {

        if ((typeof campaign.id !== "string" && typeof campaign.id !== "number") || campaign.id === "") fail("Invalid campaign id at index: " + index);

        if (campaignIds.has(campaign.id)) fail("Duplicate campaign id found: " + campaign.id + " at index: " + index);

        campaignIds.add(campaign.id);

        if (typeof campaign.name !== "string" || campaign.name === "") fail("Campaign name with campaign id " + campaign.id + " must be a non-empty string");

        if (!channelSet.has(campaign.channel)) fail("Unknown channel found " + campaign.channel + " for campaign " + campaign.name);

        if (typeof campaign.spend !== "number" || campaign.spend < 0) fail("Spend of campaign " + campaign.name + " must be a non-negative number");

        if (typeof campaign.impressions !== "number" || campaign.impressions < 0) fail("Impressions of campaign " + campaign.name + " must be a non-negative number");

        if (typeof campaign.clicks !== "number" || campaign.clicks < 0) fail("Clicks of campaign " + campaign.name + " must be a non-negative number");

        if (campaign.clicks > campaign.impressions) fail("Clicks can't be more than impressions of campaign " + campaign.name);

        if (typeof campaign.conversions !== "number" || campaign.conversions < 0) fail("Conversions of campaign " + campaign.name + " must be a non-negative number");

        if (campaign.conversions > campaign.clicks) fail("Coversions can't be more than clicks of campaign " + campaign.name);

        if (typeof campaign.revenue !== "number" || campaign.revenue < 0) fail("Revenue of campaign " + campaign.name + " must be a non-negative number");

    });

}

function fail (message) {

    console.error("Invalid Data:", message);
    process.exit(1);

}

// Utility functions

function getMetadata (data) {

    const companyName = data.companyName;
    const reportPeriod = data.reportPeriod;
    const currency = data.currency;

    return {companyName, reportPeriod, currency};

}

function getCampaignReport (campaignData) {

    return campaignData.map(campaign => {

        const campaignName = campaign.name;
        const clickThroughRate = campaign.impressions === 0 ? 0 : campaign.clicks / campaign.impressions;
        const conversionRate = campaign.clicks === 0 ? 0 : campaign.conversions / campaign.clicks;
        const returnOnInvestment = campaign.spend === 0 ? 0 : (campaign.revenue - campaign.spend) / campaign.spend;
    
        return {campaignName, clickThroughRate, conversionRate, returnOnInvestment};

    });
    
}

function getChannelReport (campaignData) {

    const metricsPerChannel = getMetricsPerChannel(campaignData);

    return Object.entries(metricsPerChannel).map( channel => {

        return {
            channel: channel[0],
            totalSpend: channel[1].spend,
            totalRevenue: channel[1].revenue,
            totalImpressions: channel[1].impressions,
            totalClicks: channel[1].clicks,
            totalConversions: channel[1].conversions,
            channelROI: channel[1].channelROI,
            bestPerformingCampaign: campaignData.find(campaign => campaign.id === channel[1].bestCampaignId).name
        };

    });

}

function getMetricsPerChannel(campaignData) {

    const metricsPerChannel = {};

    campaignData.forEach(campaign => {

        campaign.channel in metricsPerChannel ? 
        updateChannelMetrics(campaign, metricsPerChannel, campaignData) : 
        initialiseChannelMetrics(campaign, metricsPerChannel);

    });

    return metricsPerChannel;

}

function updateChannelMetrics(campaign, metricsPerChannel, campaignData) {

    metricsPerChannel[campaign.channel].spend += campaign.spend;
    metricsPerChannel[campaign.channel].revenue += campaign.revenue;
    metricsPerChannel[campaign.channel].impressions += campaign.impressions;
    metricsPerChannel[campaign.channel].clicks += campaign.clicks;
    metricsPerChannel[campaign.channel].conversions += campaign.conversions;

    const totalRevenue = metricsPerChannel[campaign.channel].revenue;
    const totalSpend = metricsPerChannel[campaign.channel].spend;

    metricsPerChannel[campaign.channel].channelROI = totalSpend ===0 ? 0 : (totalRevenue - totalSpend) / totalSpend;
    
    const bestCampaign = campaignData.find(campaign => campaign.id === metricsPerChannel[campaign.channel].bestCampaignId);

    if (campaign.revenue > bestCampaign.revenue) metricsPerChannel[campaign.channel].bestCampaignId = campaign.id;

}

function initialiseChannelMetrics(campaign, metricsPerChannel) {

    const channel = campaign.channel;
    const campaignMetrics = {
        spend: campaign.spend, 
        revenue: campaign.revenue, 
        impressions: campaign.impressions, 
        clicks: campaign.clicks, 
        conversions: campaign.conversions,
        channelROI: campaign.spend === 0 ? 0 : (campaign.revenue - campaign.spend) / campaign.spend,
        bestCampaignId: campaign.id
    };
    
    metricsPerChannel[channel] = campaignMetrics;

}

function getFinalSummary (campaignData, campaignReport, channelReport) {

    const totalSpend = campaignData.reduce((totalSpend, campaign) => totalSpend += campaign.spend, 0);

    const totalRevenue = campaignData.reduce((totalRevenue, campaign) => totalRevenue += campaign.revenue, 0);

    const overallROI = totalSpend === 0 ? 0 : (totalRevenue - totalSpend) / totalSpend;

    const bestPerformingChannel = channelReport.reduce((initialChannel, currentChannel) => currentChannel.channelROI > initialChannel.channelROI ? currentChannel : initialChannel).channel;

    const worstPerformingChannel = channelReport.reduce((initialChannel, currentChannel) => currentChannel.channelROI < initialChannel.channelROI ? currentChannel : initialChannel).channel;

    const highestROI = campaignReport.reduce((initialCampaign, currentCampaign) => currentCampaign.returnOnInvestment > initialCampaign.returnOnInvestment ? currentCampaign : initialCampaign).campaignName;

    const lowestROI = campaignReport.reduce((initialCampaign, currentCampaign) => currentCampaign.returnOnInvestment < initialCampaign.returnOnInvestment ? currentCampaign : initialCampaign).campaignName;

    return {totalSpend, totalRevenue, overallROI, bestPerformingChannel, worstPerformingChannel, highestROI, lowestROI};

}

// Display functions

function displayReport (data) {
    
    const metadata = getMetadata(data);
    const campaignReport = getCampaignReport(data.campaigns);
    const channelReport = getChannelReport(data.campaigns);
    const finalSummary = getFinalSummary(data.campaigns, campaignReport, channelReport);

    displayMetadata(metadata);
    displayCampaignReport(campaignReport);
    displayChannelReport(channelReport);
    displayFinalSummary(finalSummary);

}

function displayMetadata (metadata) {

    console.log("\n| REPORT METADATA |\n",
        "\nCompany Name: " + metadata.companyName,
        "\nReport Period: " + metadata.reportPeriod,
        "\nCurrency: " + metadata.currency
    );

}

function displayCampaignReport (campaignReport) {

    console.log("\n| CAMPAIGN REPORT |");
    
    campaignReport.forEach( campaign => {

        console.log(
            "\nCampaign: " + campaign.campaignName,
            "\nCTR: " + campaign.clickThroughRate,
            "\nConversion rate: " + campaign.conversionRate,
            "\nROI: " + campaign.returnOnInvestment
        );

    });

}

function displayChannelReport (channelReport) {

    console.log("\n| CHANNEL REPORT |");

    channelReport.forEach( channel => {

        console.log(
            "\nChannel: " + channel.channel,
            "\nTotal spend: " + channel.totalSpend,
            "\nTotal revenue: " + channel.totalRevenue,
            "\nTotal impressions: " + channel.totalImpressions,
            "\nTotal clicks: " + channel.totalClicks,
            "\nTotal conversions: " + channel.totalConversions,
            "\nChannel ROI: " + channel.channelROI,
            "\nBest performing campaign: " + channel.bestPerformingCampaign
        );

    });

}

function displayFinalSummary (finalSummary) {

    console.log("\n| FINAL MARKETING SUMMARY |\n",
        "\nTotal marketing spend: " + finalSummary.totalSpend,
        "\nTotal revenue generated: " + finalSummary.totalRevenue,
        "\nOverall ROI: " + finalSummary.overallROI,
        "\nBest performing channel: " + finalSummary.bestPerformingChannel,
        "\nWorst performing channel: " + finalSummary.worstPerformingChannel,
        "\nHighest ROI campaign: " + finalSummary.highestROI,
        "\nLowest ROI campaign: " + finalSummary.lowestROI
    );

}