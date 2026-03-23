// Smart Contract ABI
module.exports = [
  {
    "type": "constructor",
    "inputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "createEvent",
    "inputs": [
      {
        "name": "name",
        "type": "string"
      },
      {
        "name": "location",
        "type": "string"
      },
      {
        "name": "date",
        "type": "uint256"
      },
      {
        "name": "price",
        "type": "uint256"
      },
      {
        "name": "capacity",
        "type": "uint256"
      },
      {
        "name": "imageUrl",
        "type": "string"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "deactivateEvent",
    "inputs": [
      {
        "name": "eventId",
        "type": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "events",
    "inputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "name",
        "type": "string"
      },
      {
        "name": "location",
        "type": "string"
      },
      {
        "name": "date",
        "type": "uint256"
      },
      {
        "name": "price",
        "type": "uint256"
      },
      {
        "name": "capacity",
        "type": "uint256"
      },
      {
        "name": "ticketsSold",
        "type": "uint256"
      },
      {
        "name": "active",
        "type": "bool"
      },
      {
        "name": "imageUrl",
        "type": "string"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getEvent",
    "inputs": [
      {
        "name": "eventId",
        "type": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "components": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "location",
            "type": "string"
          },
          {
            "name": "date",
            "type": "uint256"
          },
          {
            "name": "price",
            "type": "uint256"
          },
          {
            "name": "capacity",
            "type": "uint256"
          },
          {
            "name": "ticketsSold",
            "type": "uint256"
          },
          {
            "name": "active",
            "type": "bool"
          },
          {
            "name": "imageUrl",
            "type": "string"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getGlobalUserTickets",
    "inputs": [
      {
        "name": "globalPhoneHash",
        "type": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getTicket",
    "inputs": [
      {
        "name": "ticketId",
        "type": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "components": [
          {
            "name": "eventId",
            "type": "uint256"
          },
          {
            "name": "phoneHash",
            "type": "bytes32"
          },
          {
            "name": "used",
            "type": "bool"
          },
          {
            "name": "paymentId",
            "type": "bytes32"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "markAsUsed",
    "inputs": [
      {
        "name": "ticketId",
        "type": "uint256"
      },
      {
        "name": "inputHash",
        "type": "bytes32"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "mintTicket",
    "inputs": [
      {
        "name": "eventId",
        "type": "uint256"
      },
      {
        "name": "phoneHash",
        "type": "bytes32"
      },
      {
        "name": "globalPhoneHash",
        "type": "bytes32"
      },
      {
        "name": "paymentId",
        "type": "bytes32"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "renounceOwnership",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "tickets",
    "inputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "eventId",
        "type": "uint256"
      },
      {
        "name": "phoneHash",
        "type": "bytes32"
      },
      {
        "name": "used",
        "type": "bool"
      },
      {
        "name": "paymentId",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "totalEvents",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "transferOwnership",
    "inputs": [
      {
        "name": "newOwner",
        "type": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "usedPayments",
    "inputs": [
      {
        "name": "",
        "type": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "EventCreated",
    "inputs": [
      {
        "name": "eventId",
        "type": "uint256",
        "indexed": true
      }
    ]
  },
  {
    "type": "event",
    "name": "EventDeactivated",
    "inputs": [
      {
        "name": "eventId",
        "type": "uint256",
        "indexed": true
      }
    ]
  },
  {
    "type": "event",
    "name": "OwnershipTransferred",
    "inputs": [
      {
        "name": "previousOwner",
        "type": "address",
        "indexed": true
      },
      {
        "name": "newOwner",
        "type": "address",
        "indexed": true
      }
    ]
  },
  {
    "type": "event",
    "name": "TicketMinted",
    "inputs": [
      {
        "name": "ticketId",
        "type": "uint256",
        "indexed": true
      },
      {
        "name": "eventId",
        "type": "uint256",
        "indexed": true
      },
      {
        "name": "phoneHash",
        "type": "bytes32",
        "indexed": true
      }
    ]
  },
  {
    "type": "event",
    "name": "TicketUsed",
    "inputs": [
      {
        "name": "ticketId",
        "type": "uint256",
        "indexed": true
      }
    ]
  }
];
