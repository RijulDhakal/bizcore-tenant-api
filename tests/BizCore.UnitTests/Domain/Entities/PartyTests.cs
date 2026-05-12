using BizCore.Domain.Entities;
using BizCore.Domain.Enums;
using FluentAssertions;
using Xunit;

namespace BizCore.UnitTests.Domain.Entities;

public class PartyTests
{
    [Fact]
    public void Party_NewParty_HasZeroBalance()
    {
        var party = new Party();
        party.OpeningBalance.Should().Be(0m);
    }

    [Theory]
    [InlineData(PartyType.Customer)]
    [InlineData(PartyType.Supplier)]
    public void Party_Types_AreValid(PartyType type)
    {
        var party = new Party();
        party.Type = type;
        party.Type.Should().Be(type);
    }

    [Fact]
    public void Party_CanSetPhone()
    {
        var party = new Party { Name = "Test Customer", Phone = "9800000000" };
        party.Phone.Should().Be("9800000000");
    }

    [Fact]
    public void Party_HasEntriesCollection()
    {
        var party = new Party { Name = "Test" };
        party.Entries.Should().NotBeNull();
        party.Entries.Should().BeEmpty();
    }
}
