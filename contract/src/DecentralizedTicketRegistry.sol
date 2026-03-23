// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract DecentralizedTicketRegistry is Ownable {
    // Data Structures
    struct EventData {
        string name;
        string location;
        uint256 date; // Unix timestamp
        uint256 price; // in wei
        uint256 capacity;
        uint256 ticketsSold;
        bool active;
        string imageUrl; // IPFS URL
    }

    struct Ticket {
        uint256 eventId;
        bytes32 phoneHash; // keccak256(phone + eventId + salt)
        bool used;
        bytes32 paymentId; // keccak256(rawPaymentId)
    }

    // State variables
    uint256 private _nextEventId = 0;
    uint256 private _nextTicketId = 0;

    constructor() Ownable(msg.sender) {}

    // Mappings
    mapping(uint256 => EventData) public events;
    mapping(uint256 => Ticket) public tickets;
    mapping(bytes32 => uint256[]) private userTickets; // globalPhoneHash => ticketIds
    mapping(bytes32 => bool) public usedPayments; // paymentId => used

    // Events
    event EventCreated(uint256 indexed eventId);
    event TicketMinted(
        uint256 indexed ticketId,
        uint256 indexed eventId,
        bytes32 indexed phoneHash
    );
    event TicketUsed(uint256 indexed ticketId);
    event EventDeactivated(uint256 indexed eventId);

    // ============ Write Functions ============

    /**
     * @dev Creates a new event on-chain.
     * Sets ticketsSold = 0, active = true.
     * Emits EventCreated.
     */
    function createEvent(
        string memory name,
        string memory location,
        uint256 date,
        uint256 price,
        uint256 capacity,
        string memory imageUrl
    ) external onlyOwner {
        require(capacity > 0, "Invalid capacity");

        EventData storage eventData = events[_nextEventId];
        eventData.name = name;
        eventData.location = location;
        eventData.date = date;
        eventData.price = price;
        eventData.capacity = capacity;
        eventData.ticketsSold = 0;
        eventData.active = true;
        eventData.imageUrl = imageUrl;

        emit EventCreated(_nextEventId);
        _nextEventId++;
    }

    /**
     * @dev Mints a ticket after payment is confirmed.
     * Stores the Ticket struct, pushes ticketId into userTickets[globalPhoneHash],
     * marks payment as used, increments ticketsSold.
     * Emits TicketMinted.
     */
    function mintTicket(
        uint256 eventId,
        bytes32 phoneHash,
        bytes32 globalPhoneHash,
        bytes32 paymentId
    ) external onlyOwner {
        require(events[eventId].active, "Event inactive");
        require(
            events[eventId].ticketsSold < events[eventId].capacity,
            "Sold out"
        );
        require(!usedPayments[paymentId], "Payment already used");

        // Create ticket
        Ticket storage ticket = tickets[_nextTicketId];
        ticket.eventId = eventId;
        ticket.phoneHash = phoneHash;
        ticket.used = false;
        ticket.paymentId = paymentId;

        // Add to user's ticket list
        userTickets[globalPhoneHash].push(_nextTicketId);

        // Mark payment as used
        usedPayments[paymentId] = true;

        // Increment ticket count
        events[eventId].ticketsSold++;

        emit TicketMinted(_nextTicketId, eventId, phoneHash);
        _nextTicketId++;
    }

    /**
     * @dev Called at the event gate. Verifies inputHash matches ticket.phoneHash.
     * Sets used = true. Emits TicketUsed.
     */
    function markAsUsed(uint256 ticketId, bytes32 inputHash) external onlyOwner {
        Ticket storage ticket = tickets[ticketId];
        require(!ticket.used, "Already used");
        require(ticket.phoneHash == inputHash, "Phone mismatch");

        ticket.used = true;
        emit TicketUsed(ticketId);
    }

    /**
     * @dev Sets active = false on an event.
     * Prevents further ticket minting. Refunds handled off-chain.
     * Emits EventDeactivated.
     */
    function deactivateEvent(uint256 eventId) external onlyOwner {
        require(events[eventId].active, "Already inactive");
        events[eventId].active = false;
        emit EventDeactivated(eventId);
    }

    // ============ View Functions ============

    /**
     * @dev Returns all ticketIds for a user across all events in one call.
     * globalPhoneHash = keccak256(phone + salt) — no eventId, works globally.
     */
    function getGlobalUserTickets(bytes32 globalPhoneHash)
        external
        view
        returns (uint256[] memory)
    {
        return userTickets[globalPhoneHash];
    }

    /**
     * @dev Returns a single Ticket struct.
     * Also accessible via the auto-generated contract.tickets(id).
     */
    function getTicket(uint256 ticketId)
        external
        view
        returns (Ticket memory)
    {
        return tickets[ticketId];
    }

    /**
     * @dev Returns a single EventData struct.
     * Also accessible via contract.events(id).
     */
    function getEvent(uint256 eventId)
        external
        view
        returns (EventData memory)
    {
        return events[eventId];
    }

    /**
     * @dev Returns _nextEventId — total events ever created.
     * Backend uses this as the loop upper bound when listing events.
     */
    function totalEvents() external view returns (uint256) {
        return _nextEventId;
    }
}
