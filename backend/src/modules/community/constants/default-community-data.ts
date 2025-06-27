import { ICommunityInfoDto, IGetCommunityDto } from '../dtos/community.dto';

export const DEFAULT_COMMUNITY_DATA: IGetCommunityDto = {
  info: {
    logoUrl: './images/community/community-logo.png',
    email: 'community@email.com',
    address: 'Community Address<br>City, Country<br>Postal Code',
    phone: '+1234567890',
    webPage: 'https://community.webpage.com',
  } satisfies ICommunityInfoDto,
  tabs: [
    {
      title: 'Sample Tab',
      content:
        'Prepare endpoint that returns community data. Community data is an object with "info" and "tabs" properties. Info is an object with logoUrl, email, webPage, phone, and address properties. Tabs is an array of objects with title and content properties.<br><br>{<br>"info": {<br>&nbsp;&nbsp;&nbsp;&nbsp;"logoUrl": "./images/community/community-logo.png",<br>&nbsp;&nbsp;&nbsp;&nbsp;"email": "community@email.com",<br>&nbsp;&nbsp;&nbsp;&nbsp;"address": "Community Address&lt;br&gt;City, Country&lt;br&gt;Postal Code",<br>&nbsp;&nbsp;&nbsp;&nbsp;"phone": "+1234567890",<br>&nbsp;&nbsp;&nbsp;&nbsp;"webPage": "https://community.webpage.com"<br>},<br>"tabs": [<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"title": "Sample Tab1",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"content": "Content of Sample Tab1"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"title": "Sample Tab2",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"content": "Content of Sample Tab2"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"title": "Sample Tab3",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"content": "Content of Sample Tab3"<br>&nbsp;&nbsp;&nbsp;&nbsp;}<br>]<br>}',
    },
    {
      title: 'Meetings',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
    },
    {
      title: 'Mission',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
    },
    {
      title: 'Diaconie',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
    },
    {
      title: 'Structure',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
    },
    {
      title: 'Regulations',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
    },
  ],
} satisfies IGetCommunityDto;
