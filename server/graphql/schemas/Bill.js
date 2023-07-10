import { gql } from "graphql-tag";
export const billType = gql`
  input Bill_data{
    _id:String
    tableId:String
    total: Float
    productId: String
    amount:Int
  }
  input Filters_bills {
    _id:String
    tableId:String
  }
  type Query {
    Bills(filters: Filters_bills, options: Options): [Bill]
    billsTotal:Int
  }
  type Mutation {
    Bill_save(billData: Bill_data): String
    Bill_delete(_id: String!): Boolean
  }
  type Bill {
    _id: String
    tableId:String
    total: Float
    products: [Product]
    table:Table
    isPaid: Boolean
    isRemove: Boolean
  }
`;
